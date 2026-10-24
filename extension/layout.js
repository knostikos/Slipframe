/* Pure layout calculation, shared with fit-to-screen tests. */
globalThis.SlipframeLayout = {
  fit(count, width, height, options={}) {
    const n = Math.max(1, count), gap = options.gap ?? 20, caption = 32;
    const maximum = options.tileWidth ?? 520;
    if(options.layout==='grid') {
      const columns=Math.min(n,Math.max(1,Math.floor((width+gap)/(maximum+gap))));
      const cardWidth=Math.max(60,Math.min(maximum,(width-gap*(columns-1))/columns));
      const rows=Math.ceil(n/columns);
      return {columns,width:cardWidth,overflow:rows*(cardWidth/1.6+caption)+(rows-1)*gap>height};
    }
    let best = {columns: 1, width: 0, overflow: false};
    for (let c = 1; c <= Math.min(n, 40); c++) {
      const rows = Math.ceil(n / c);
      const w = Math.min(maximum, (width-gap*(c-1))/c,
        ((height-gap*(rows-1))/rows-caption)*1.6);
      if (w > best.width) best = {columns:c, width:w, overflow:false};
    }
    if (best.width >= 120) return best;
    const c = Math.max(1, Math.floor((width+gap)/(150+gap)));
    return {columns:c, width:Math.max(60, Math.min(maximum,(width-gap*(c-1))/c)), overflow:true};
  }
};
