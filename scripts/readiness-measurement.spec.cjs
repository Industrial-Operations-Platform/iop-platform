const {distribution,measure}=require('./local/measure-readiness.cjs');
test('measurement quantiles use observed samples and do not invent a plant threshold',()=>{expect(distribution([40,10,30,20])).toEqual({min:10,p50:20,p95:40,max:40});expect(()=>measure('arbitrary-shell-command')).toThrow();expect(()=>measure('typecheck',0)).toThrow();});
