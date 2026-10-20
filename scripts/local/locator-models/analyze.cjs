// Source-specific WinCC schematic adapter. Colors describe pixels, never live health.
const {createHash} = require('node:crypto');
const VERSION = 'wincc-symbols-4';
const LIMIT = 1000;

function image(width, height, rgba) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > 16777216 || rgba.length !== width * height * 4)
    throw new Error('Unsupported finite schematic image.');
  const dark = new Uint8Array(width * height), green = new Uint8Array(dark.length), rail = new Uint8Array(dark.length);
  for (let i = 0; i < dark.length; i++) {
    const r = rgba[i*4], g = rgba[i*4+1], b = rgba[i*4+2];
    dark[i] = Math.max(r,g,b) < 95 ? 1 : 0;
    green[i] = g > 110 && r < 140 && b < 120 && g-r > 40 && g-b > 40 ? 1 : 0;
    rail[i] = Math.max(r,g,b)-Math.min(r,g,b) < 18 && r >= 55 && r < 185 ? 1 : 0;
  }
  return {width,height,rgba,dark,green,rail};
}

function regions(mask, width, height, maxArea = 1000) {
  const seen = new Uint8Array(mask.length), queue = new Int32Array(mask.length), boxes = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    let head = 0, tail = 1, minX = width, minY = height, maxX = 0, maxY = 0;
    queue[0] = start; seen[start] = 1;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for (const next of [x > 0 ? p-1 : -1,x+1 < width ? p+1 : -1,y > 0 ? p-width : -1,y+1 < height ? p+width : -1])
        if (next >= 0 && mask[next] && !seen[next]) {seen[next]=1;queue[tail++]=next;}
    }
    if (tail <= maxArea) boxes.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,area:tail});
  }
  return boxes;
}

function pixel(mask, width, height, x, y) {
  x=Math.round(x);y=Math.round(y);
  return x >= 0 && y >= 0 && x < width && y < height ? mask[y*width+x] : 0;
}
function circleScore(im, cx, cy, radius) {
  let ring=0, outside=0, inside=0, color=0, filled=0,corners=0;
  const halves=[[0,0],[0,0],[0,0],[0,0]];
  for (let i=0;i<32;i++) {
    const angle=i*Math.PI/16;
    ring+=Math.max(...[-0.6,0,0.6].map(d=>pixel(im.dark,im.width,im.height,cx+Math.cos(angle)*(radius+d),cy+Math.sin(angle)*(radius+d))));
    outside+=pixel(im.dark,im.width,im.height,cx+Math.cos(angle)*(radius+2),cy+Math.sin(angle)*(radius+2));
  }
  for (let y=-Math.floor(radius-2);y<=radius-2;y++) for (let x=-Math.floor(radius-2);x<=radius-2;x++) {
    if (x*x+y*y > (radius-2)**2) continue;
    const ink=pixel(im.dark,im.width,im.height,cx+x,cy+y);
    inside++;color+=pixel(im.green,im.width,im.height,cx+x,cy+y);filled+=ink;
    for(const half of [x+y<0?0:1,x-y<0?2:3]){halves[half][0]++;halves[half][1]+=ink;}
  }
  for(const dx of [-radius,radius])for(const dy of [-radius,radius])corners+=pixel(im.dark,im.width,im.height,cx+dx,cy+dy);
  const fractions=halves.map(([total,ink])=>ink/Math.max(1,total));
  const contrast=Math.max(Math.abs(fractions[0]-fractions[1]),Math.abs(fractions[2]-fractions[3]));
  return {score:ring/32-outside/64,color:color/Math.max(1,inside),fill:filled/Math.max(1,inside),contrast,corners,ring:ring/32};
}
function motors(im) {
  const darkSeeds=regions(im.dark,im.width,im.height,320).filter(b=>b.w>=11 && b.h>=11 && b.w<=23 && b.h<=23 && b.w/b.h>=0.7 && b.w/b.h<=1.4);
  const framedSeeds=darkSeeds.filter(seed=>{
    const edges=[0,0,0,0];
    const ink=(x,y)=>Math.max(pixel(im.dark,im.width,im.height,x,y),pixel(im.rail,im.width,im.height,x,y));
    for(let dx=0;dx<seed.w;dx++){edges[0]+=ink(seed.x+dx,seed.y)/seed.w;edges[1]+=ink(seed.x+dx,seed.y+seed.h-1)/seed.w;}
    for(let dy=0;dy<seed.h;dy++){edges[2]+=ink(seed.x,seed.y+dy)/seed.h;edges[3]+=ink(seed.x+seed.w-1,seed.y+dy)/seed.h;}
    return edges.filter(edge=>edge>=0.7).length>=3;
  });
  const seeds = [...regions(im.green,im.width,im.height,280).filter(b=>b.w>=3 && b.h>=3 && b.w<=19 && b.h<=19 && b.area>=8),...darkSeeds];
  const found=[];
  for (const seed of seeds) {
    const x=seed.x+(seed.w-1)/2,y=seed.y+(seed.h-1)/2;
    if (x < 25 || y < 35 || found.some(m=>Math.hypot(m.cx-x,m.cy-y)<10)) continue;
    const framed=framedSeeds.some(frame=>x>=frame.x && y>=frame.y && x<=frame.x+frame.w && y<=frame.y+frame.h);
    let best=null;
    for (let dy=-3;dy<=3;dy++) for (let dx=-3;dx<=3;dx++) for (const radius of [5.5,6.5,7.5,8.5]) {
      const score=circleScore(im,x+dx,y+dy,radius);
      const motorFill=score.color>0.06 ? score.fill>=0.15 && score.contrast>=0.25 : !framed && score.fill>=0.24 && score.fill<=0.8 && score.corners<=1 && score.contrast>=0.35;
      if (motorFill && score.ring>=0.81 && score.score>=0.7 && (!best || score.score>best.score)) best={cx:x+dx,cy:y+dy,radius,...score};
    }
    if (best && !found.some(m=>Math.hypot(m.cx-best.cx,m.cy-best.cy)<11))
      found.push({x:Math.round(best.cx-best.radius),y:Math.round(best.cy-best.radius),w:Math.round(best.radius*2+1),h:Math.round(best.radius*2+1),cx:best.cx,cy:best.cy,method:best.color>0.06?'circular-motor-with-colored-fill':'circular-motor-with-neutral-fill'});
  }
  return found.sort((a,b)=>a.y-b.y || a.x-b.x);
}

function lines(im, vertical) {
  const length=vertical?im.height:im.width, rows=vertical?im.width:im.height, result=[];
  for (let across=0;across<rows;across++) {
    let start=-1;
    for (let along=0;along<=length;along++) {
      const ink=along<length && im.rail[vertical?along*im.width+across:across*im.width+along];
      if (ink && start<0) start=along;
      if (!ink && start>=0) {if(along-start>=32)result.push({across,start,end:along-1});start=-1;}
    }
  }
  // Adjacent anti-aliased rows describe one rail, not several conveyors.
  return result.filter((line,i)=>!result.slice(Math.max(0,i-100),i).some(other=>line.across-other.across<=2 && line.across>other.across && Math.abs(line.start-other.start)<4 && Math.abs(line.end-other.end)<4));
}
function conveyors(im, motorBoxes) {
  const result=[];
  for (const vertical of [false,true]) {
    const rails=lines(im,vertical);
    for(let i=0;i<rails.length;i++) for(let j=i+1;j<rails.length;j++) {
      const a=rails[i],b=rails[j],gap=b.across-a.across;
      if(gap>34)break;
      if(gap<13)continue;
      const start=Math.max(a.start,b.start),end=Math.min(a.end,b.end);
      if(end-start<35)continue;
      const cx=vertical?(a.across+b.across)/2:(start+end)/2,cy=vertical?(start+end)/2:(a.across+b.across)/2;
      // A third parallel rail inside a pair is an adjacent lane, not its width.
      if(rails.slice(i+1,j).some(c=>c.across-a.across>3 && b.across-c.across>3 && Math.min(c.end,end)-Math.max(c.start,start)>(end-start)*0.8))continue;
      const onMotor=motorBoxes.some(m=>vertical?Math.abs(m.cx-cx)<gap/2+4 && m.cy>=start-16 && m.cy<=end+16:Math.abs(m.cy-cy)<gap/2+4 && m.cx>=start-16 && m.cx<=end+16);
      // Motor-free passive/buffer runs are retained only when their paired rails
      // have substantial overlap, without assigning unseen motors or sensors.
      if(!onMotor && (end-start<90 || Math.abs(a.start-b.start)>5 || Math.abs(a.end-b.end)>5))continue;
      if(!onMotor && cy<35)continue;
      const box={x:vertical?a.across:start,y:vertical?start:a.across,w:vertical?gap:end-start,h:vertical?end-start:gap,vertical,start,end,across:(a.across+b.across)/2,method:onMotor?'paired-rails-with-motor-evidence':'paired-passive-rails'};
      let white=0,neutral=0;
      for(let n=1;n<=20;n++) {
        const x=Math.round(vertical?box.x+box.w/2:box.x+box.w*n/21),y=Math.round(vertical?box.y+box.h*n/21:box.y+box.h/2),p=(y*im.width+x)*4;
        if(Math.min(im.rgba[p],im.rgba[p+1],im.rgba[p+2])>228)white++;
        if(Math.max(im.rgba[p],im.rgba[p+1],im.rgba[p+2])-Math.min(im.rgba[p],im.rgba[p+1],im.rgba[p+2])<18 && im.rgba[p]>=180 && im.rgba[p]<=228)neutral++;
      }
      if(white>=11 || (!onMotor && neutral<13))continue;
      if(!result.some(c=>c.vertical===vertical && Math.abs(c.across-box.across)<4 && Math.min(c.end,end)-Math.max(c.start,start)>(end-start)*0.8))result.push(box);
    }
  }
  return result.sort((a,b)=>a.y-b.y || a.x-b.x);
}

function diagonalConveyors(im,motorBoxes) {
  const result=[];
  for(const slope of [-1,1]) {
    const rails=[];
    const min=slope===1?-im.width:0,max=slope===1?im.height:im.width+im.height;
    for(let across=min;across<=max;across++) {
      const first=Math.max(0,slope===1?-across:across-im.height+1),last=Math.min(im.width-1,slope===1?im.height-1-across:across);
      let start=-1;
      for(let x=first;x<=last+1;x++) {
        const ink=x<=last && im.rail[(slope*x+across)*im.width+x];
        if(ink && start<0)start=x;
        if(!ink && start>=0){if(x-start>=24)rails.push({across,start,end:x-1});start=-1;}
      }
    }
    for(let i=0;i<rails.length;i++)for(let j=i+1;j<rails.length;j++) {
      const a=rails[i],b=rails[j],gap=b.across-a.across;
      if(gap>48)break;if(gap<18)continue;
      const start=Math.max(a.start,b.start),end=Math.min(a.end,b.end),middle=(a.across+b.across)/2;
      if(end-start<28)continue;
      if(rails.slice(i+1,j).some(c=>c.across-a.across>3 && b.across-c.across>3 && Math.min(c.end,end)-Math.max(c.start,start)>(end-start)*0.8))continue;
      const near=motorBoxes.some(m=>Math.abs(m.cy-slope*m.cx-middle)<gap/2+6 && m.cx>=start-16 && m.cx<=end+16);
      if(!near && end-start<90)continue;
      if(result.some(c=>c.slope===slope && Math.abs(c.across-middle)<4 && Math.min(c.end,end)-Math.max(c.start,start)>(end-start)*0.8))continue;
      const dx=-slope*gap/4,dy=gap/4,y0=slope*start+middle,y1=slope*end+middle;
      const points=[[start+dx,y0+dy],[end+dx,y1+dy],[end-dx,y1-dy],[start-dx,y0-dy]];
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);
      result.push({x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y,cx:(start+end)/2,cy:(y0+y1)/2,rotation:slope*45,lengthPixels:(end-start)*Math.SQRT2,depthPixels:gap/Math.SQRT2,slope,across:middle,start,end,points,method:'paired-diagonal-rails'});
    }
  }
  return result.sort((a,b)=>a.y-b.y || a.x-b.x);
}

function sensors(im, belts, motorBoxes) {
  const found=[];
  for(const belt of belts) {
    const low=belt.vertical?belt.x:belt.y,span=belt.vertical?belt.w:belt.h;
    let run=-1;
    for(let along=Math.ceil(belt.start)+4;along<=belt.end-3;along++) {
      let count=0,total=0;
      for(let across=Math.ceil(low)+3;across<low+span-2;across++) {
        total++;count+=pixel(im.rail,im.width,im.height,belt.vertical?across:along,belt.vertical?along:across);
      }
      const bar=total>=8 && count/total>=0.88;
      if(bar && run<0)run=along;
      if((!bar || along===Math.floor(belt.end)-3) && run>=0) {
        const thickness=along-run,cx=belt.vertical?belt.across:(run+along)/2,cy=belt.vertical?(run+along)/2:belt.across;
        const nearby=motorBoxes.some(m=>belt.vertical?Math.abs(m.cx-cx)<12 && Math.abs(m.cy-cy)>=11 && Math.abs(m.cy-cy)<90:Math.abs(m.cy-cy)<12 && Math.abs(m.cx-cx)>=11 && Math.abs(m.cx-cx)<90);
        if(thickness>=1 && thickness<=3 && nearby && !motorBoxes.some(m=>Math.hypot(m.cx-cx,m.cy-cy)<12) && !found.some(s=>Math.hypot(s.x+s.w/2-cx,s.y+s.h/2-cy)<8))
          found.push({x:belt.vertical?low:run,y:belt.vertical?run:low,w:belt.vertical?span:Math.max(2,thickness),h:belt.vertical?Math.max(2,thickness):span,method:'thin-cross-belt-bar-near-motors'});
        run=-1;
      }
    }
  }
  return found.sort((a,b)=>a.y-b.y || a.x-b.x);
}

function component(reference, kind, box, index) {
  const W=reference.width,H=reference.height,cx=box.cx??box.x+box.w/2,cy=box.cy??box.y+box.h/2;
  const evidence=[box.x,box.y,box.w,box.h].map(Math.round);
  const vertical=kind==='conveyor' ? box.vertical : kind==='photoelectric-sensor' && box.h>box.w;
  const rotation=box.rotation??(vertical?90:0);
  const identity=createHash('sha256').update(`${reference.sha256}|${kind}|${evidence.join(',')}|${rotation}`).digest('hex').slice(0,24);
  return {id:`schematic-${kind}-${identity}`,kind,label:`${kind==='motor'?'Motor':kind==='photoelectric-sensor'?'Photoelectric sensor':'Conveyor'} ${index+1} (reference)`,x:cx/W,y:cy/H,elevation:null,rotation,width:Math.max(0.001,(box.lengthPixels??(vertical?box.h:box.w))/W),depth:Math.max(0.001,(box.depthPixels??(vertical?box.w:box.h))/H),height:kind==='conveyor'?0.012:0.018,assetId:'',verification:'provisional',note:`Source SHA256 ${reference.sha256}; pixel box [${evidence.join(',')}], rotation ${rotation}; ${VERSION}/${box.method}. Provisional symbol/topology; scale, identity and elevation unverified. Snapshot colors are not live health.`};
}
function analyze(reference, rgba, previousComponents=[]) {
  const im=image(reference.width,reference.height,rgba),motorBoxes=motors(im),straight=conveyors(im,motorBoxes),belts=[...straight,...diagonalConveyors(im,motorBoxes)],sensorBoxes=sensors(im,straight,motorBoxes);
  const generated=[...belts.map((b,i)=>component(reference,'conveyor',b,i)),...motorBoxes.map((b,i)=>component(reference,'motor',b,i)),...sensorBoxes.map((b,i)=>component(reference,'photoelectric-sensor',b,i))];
  // Human-traced topology and readable scanner labels are more informative than
  // automatic rail segmentation. Reuse them only as the explicit old baseline.
  const retained=previousComponents.filter(c=>['conveyor','curve','lift','scanner','landmark'].includes(c.kind));
  const components=retained.length?[...retained,...generated.filter(c=>c.kind!=='conveyor')]:generated;
  if(components.length>LIMIT)throw new Error('Schematic exceeds the 1,000-component review budget.');
  return {referenceId:reference.id,previousComponents,components,evidence:{sourceSha256:reference.sha256,sourceWidth:im.width,sourceHeight:im.height,algorithm:VERSION,detected:{conveyors:belts.length,motors:motorBoxes.length,photoelectricSensors:sensorBoxes.length},retainedTopology:retained.length,status:components.length?'provisional-review-required':'manual-trace-required',limitations:['Image-local coordinates only; no measured scale or elevation.','Circular half-filled symbols are motors; thin cross-belt bars are candidate photoelectric sensors.','Unclear, diagonal and occluded symbols may remain undetected; counts are not an equipment inventory.','No source identifiers, canonical asset links, sensor health or unseen equipment are inferred.','Flow direction is not inferred; component rotation describes geometry only.']},overlay:[...belts.map(b=>({...b,kind:'conveyor'})),...motorBoxes.map(b=>({...b,kind:'motor'})),...sensorBoxes.map(b=>({...b,kind:'photoelectric-sensor'}))]};
}
module.exports={VERSION,LIMIT,image,regions,motors,conveyors,diagonalConveyors,sensors,analyze};
