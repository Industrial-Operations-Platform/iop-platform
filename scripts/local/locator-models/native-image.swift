import AppKit
import Foundation

enum ImageFailure: Error { case invalidInput }
let args=CommandLine.arguments
guard args.count >= 4 else { throw ImageFailure.invalidInput }
let input=try Data(contentsOf:URL(fileURLWithPath:args[2]))
guard let source=NSBitmapImageRep(data:input), source.pixelsWide > 0, source.pixelsHigh > 0,
      source.pixelsWide * source.pixelsHigh <= 16_777_216 else { throw ImageFailure.invalidInput }
let width=source.pixelsWide, height=source.pixelsHigh
if args[1] == "decode" {
    guard source.bitsPerSample == 8, !source.isPlanar, source.samplesPerPixel >= 3, source.samplesPerPixel <= 4,
          let pixels=source.bitmapData else { throw ImageFailure.invalidInput }
    var output=Data(capacity:8+width*height*4)
    for n in [UInt32(width),UInt32(height)] { var v=n.bigEndian;withUnsafeBytes(of:&v){output.append(contentsOf:$0)} }
    let alphaFirst=source.bitmapFormat.contains(.alphaFirst)
    for y in 0..<height { for x in 0..<width {
        let offset=y*source.bytesPerRow+x*source.samplesPerPixel, rgb=offset+(alphaFirst ? 1:0)
        output.append(pixels[rgb]);output.append(pixels[rgb+1]);output.append(pixels[rgb+2]);output.append(255)
    }}
    try output.write(to:URL(fileURLWithPath:args[3]),options:Data.WritingOptions.withoutOverwriting)
} else if args[1] == "overlay", args.count == 5 {
    let boxes=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:args[3]))) as! [[String:Any]]
    guard boxes.count <= 1000 else { throw ImageFailure.invalidInput }
    let canvas=NSImage(size:NSSize(width:width,height:height))
    canvas.lockFocus()
    NSImage(cgImage:source.cgImage!,size:NSSize(width:width,height:height)).draw(in:NSRect(x:0,y:0,width:width,height:height))
    for box in boxes {
        guard let x=box["x"] as? Double,let y=box["y"] as? Double,let w=box["w"] as? Double,let h=box["h"] as? Double else {throw ImageFailure.invalidInput}
        let kind=box["kind"] as? String ?? "conveyor"
        let color=kind == "motor" ? NSColor.systemCyan : kind == "photoelectric-sensor" ? NSColor.systemOrange : NSColor.systemBlue
        color.withAlphaComponent(0.85).setStroke()
        let rect=NSRect(x:x-2,y:Double(height)-y-h-2,width:w+4,height:h+4)
        let path=kind == "motor" ? NSBezierPath(ovalIn:rect):NSBezierPath(rect:rect)
        if let points=box["points"] as? [[Double]], points.count == 4 {
            path.removeAllPoints()
            path.move(to:NSPoint(x:points[0][0],y:Double(height)-points[0][1]))
            for point in points.dropFirst(){path.line(to:NSPoint(x:point[0],y:Double(height)-point[1]))}
            path.close()
        }
        path.lineWidth=kind == "conveyor" ? 1.0:2.0;path.stroke()
    }
    canvas.unlockFocus()
    guard let tiff=canvas.tiffRepresentation,let png=NSBitmapImageRep(data:tiff)?.representation(using:.png,properties:[:]) else {throw ImageFailure.invalidInput}
    try png.write(to:URL(fileURLWithPath:args[4]),options:Data.WritingOptions.withoutOverwriting)
} else { throw ImageFailure.invalidInput }
