// const PROF=makeProfiler();

// PROF.wrapProto(Cell, [
//   'updatePosition','updateVelocity','updateMovement',
// 	'update', 'render', 'pxAtp'
// ]);

function makeProfiler() {
  const T=new Map, WRAPPED=new WeakSet;
  return {
    tic(k){ const a=T.get(k)||{t:0,n:0}; a.s=performance.now(); T.set(k,a); },
    toc(k){ const a=T.get(k); if(!a||a.s===undefined) return; a.t+=performance.now()-a.s; a.n++; a.s=undefined; },
    wrap(o,k,label){
      const f=o?.[k]; if(typeof f!=='function'||WRAPPED.has(f)) return;
      const key=label||k; const self=this;
      o[k]=function(...args){ self.tic(key); try{ return f.apply(this,args); } finally{ self.toc(key); } };
      WRAPPED.add(o[k]);
    },
    wrapMany(o,keys,prefix=''){
      for(const k of keys) this.wrap(o,k,prefix?prefix+':'+k:k);
    },
    wrapProto(Ctor,keys,prefix=''){
      const o=Ctor&&Ctor.prototype; if(!o) return;
      this.wrapMany(o,keys,prefix||Ctor.name);
    },
    reset(){ T.clear(); },
    report(minMs=0){
      const arr=[...T.entries()].map(([k,a])=>({k,t:+a.t.toFixed(3),n:a.n,avg:+(a.t/Math.max(1,a.n)).toFixed(3)}))
        .filter(x=>x.t>=minMs).sort((a,b)=>b.t-a.t);
      console.table(arr);
    }
  };
}
