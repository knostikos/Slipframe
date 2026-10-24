const assert=require('node:assert/strict');require('../extension/settings.js');require('../extension/hotkey.js');require('../extension/layout.js');
const S=globalThis.SlipframeSettings;
assert.deepEqual(S.sanitize(),S.defaults);
assert.equal(S.sanitize({blur:99}).blur,24);assert.equal(S.sanitize({dim:-10}).dim,0);
assert.equal(S.sanitize({gap:NaN}).gap,20);assert.equal(S.sanitize({preload:'false'}).preload,true);
assert.equal('showDomains' in S.sanitize({showDomains:true}),false);assert.equal(S.sanitize(null).layout,'fit');
const K=globalThis.SlipframeHotkey;
assert.equal(K.fromEvent({key:' ',ctrlKey:true,shiftKey:true}),'Ctrl+Shift+Space');
assert.equal(K.fromEvent({key:'F4'}),'F4');assert.equal(K.fromEvent({key:'Control'}),null);
assert.equal(K.fromEvent({key:'a',code:'KeyA',altKey:true}),'Alt+A');
for(const layout of ['fit','grid'])for(const gap of [8,20,40])for(const count of [1,6,20,60]){
 const r=SlipframeLayout.fit(count,1400,800,{layout,gap,tileWidth:300});
 assert(r.width>0&&r.width<=300&&r.columns>=1);assert(r.columns*r.width+(r.columns-1)*gap<=1400+.01);
 if(!r.overflow){const rows=Math.ceil(count/r.columns);assert(rows*(r.width/1.6+32)+(rows-1)*gap<=800+.01);}
}
console.log('PASS: preference defaults/type validation/clamping, hotkey conversion, 24 customized layouts.');
