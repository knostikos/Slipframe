const assert=require('node:assert/strict');
require('../extension/layout.js');
let checks=0, fitted=0;
for(const [width,height] of [[320,600],[1200,720],[1800,950],[3300,1250]]) {
  for(const count of [1,2,3,6,12,20,30,50,100,200]) {
    const r=globalThis.SlipframeLayout.fit(count,width,height);
    assert(r.columns>=1&&r.width>0);
    assert(r.columns*r.width+(r.columns-1)*20<=width+.01);
    if(!r.overflow){
      const rows=Math.ceil(count/r.columns);
      assert(rows*(r.width/1.6+32)+(rows-1)*20<=height+.01);
      fitted++;
    }
    checks++;
  }
}
console.log(`PASS: ${checks} viewport/tab-count combinations; ${fitted} fit vertically, remainder use readable scrolling.`);
