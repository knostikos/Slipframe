/* Shared defaults and validation. Stored locally, never synchronized/uploaded. */
globalThis.SlipframeSettings = {
  defaults: {layout:'fit', tileWidth:520, blur:3, dim:15, gap:20, preload:true},
  sanitize(value={}) {
    const d=this.defaults, result={...d};
    if(!value || typeof value!=='object')return result;
    result.layout=value.layout==='grid'?'grid':'fit';
    for(const [key,min,max] of [['tileWidth',180,520],['blur',0,24],['dim',0,60],['gap',8,40]]) {
      if(typeof value[key]==='number'&&Number.isFinite(value[key]))result[key]=Math.max(min,Math.min(max,Math.round(value[key])));
    }
    for(const key of ['preload'])if(typeof value[key]==='boolean')result[key]=value[key];
    return result;
  }
};
