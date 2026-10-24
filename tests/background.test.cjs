/* Behavior tests for extension logic; Firefox APIs are mocks, not runtime QA. */
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const event=()=>({listeners:[],addListener(f){this.listeners.push(f)}});
const tab=(id,extra={})=>({id,windowId:1,url:`https://example.com/${id}`,title:`Tab ${id}`,active:id===1,...extra});
function fixture(){
 const list=[tab(1),tab(2,{favIconUrl:'https://example.com/favicon.ico'}),tab(3,{hidden:true}),tab(4,{windowId:2})];let open=false,injects=0,warnings=0;const captures=[],updates=[],messages=[],removed=[];
 const browser={
  tabs:{query:async q=>list.filter(t=>(!q.active||t.active)&&(!q.windowId||t.windowId===q.windowId)&&(q.currentWindow?t.windowId===1:true)),
   get:async id=>{const t=list.find(t=>t.id===id);if(!t)throw Error('missing');return t},
   captureTab:async id=>{captures.push({id,open});return 'data:image/jpeg;base64,dGVzdA=='},
   executeScript:async()=>{injects++},sendMessage:async(id,m)=>{messages.push(m);if(m.type==='status')return {open};if(m.type==='open')open=true;if(m.type==='close')open=false;return {ok:true}},
   update:async(id,change)=>updates.push({id,change}),
   remove:async id=>{removed.push(id);for(const f of browser.tabs.onRemoved.listeners)f(id);},
   onRemoved:event(),onUpdated:event(),onActivated:event(),onCreated:event()},
  browserAction:{onClicked:event()},commands:{onCommand:event()},
  runtime:{getURL:p=>'moz-extension://test/'+p,onMessage:event(),onMessageExternal:event()},
  storage:{local:{get:async()=>({})},onChanged:event()},
  notifications:{create:async()=>warnings++}
 };
 const ctx=vm.createContext({browser,Map,Set,Date,Symbol,Promise,clearTimeout,setTimeout:(fn,ms)=>{const timer=setTimeout(fn,ms);timer.unref();return timer;},console});
 vm.runInContext(fs.readFileSync(__dirname+'/../extension/settings.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(__dirname+'/../extension/background.js','utf8'),ctx);
 return {browser,list,captures,updates,messages,removed,ctx,get open(){return open},get warnings(){return warnings},get injects(){return injects}};
}
(async()=>{
 let f=fixture();
 await vm.runInContext('toggle()',f.ctx);assert(f.open);assert.equal(f.captures[0].open,false,'active page captured before overlay');
 assert.deepEqual(f.messages.find(m=>m.type==='open').tabs.map(t=>t.id),[1,2]);
 assert.equal(f.messages.find(m=>m.type==='open').tabs[1].favicon,'https://example.com/favicon.ico');
 await vm.runInContext('toggle()',f.ctx);assert(!f.open);
 const external=f.browser.runtime.onMessageExternal.listeners[0];
 await external({action:'toggle'},{id:'untrusted'});assert(!f.open);
 await external({action:'toggle'},{id:'{506e023c-7f2b-40a3-8066-bc5deb40aebe}'});assert(f.open);
 const internal=f.browser.runtime.onMessage.listeners[0];
 await internal({type:'activate',id:4},{tab:f.list[0]});assert.equal(f.updates.length,0,'crosswindow activation denied');
 await internal({type:'activate',id:2},{tab:f.list[0]});assert.equal(f.updates[0].id,2);assert(!f.open);
 f=fixture();f.browser.tabs.executeScript=async()=>{throw Error('protected')};f.browser.tabs.sendMessage=async()=>{throw Error('absent')};
 const result=await vm.runInContext('toggle()',f.ctx);assert.equal(result.ok,false);assert.equal(f.warnings,1);
 f=fixture();await Promise.all([vm.runInContext('toggle()',f.ctx),vm.runInContext('toggle()',f.ctx)]);
 assert.equal(f.messages.filter(m=>m.type==='open').length,1,'rapid overlapping calls do not double-open');
 await vm.runInContext('toggle()',f.ctx);
 f=fixture();await vm.runInContext('queueWarm(2,0); warmNext()',f.ctx);
 assert(f.captures.some(c=>c.id===2),'preloads without overview opening');
 assert(!f.open);
 vm.runInContext('sessions.set(1, Symbol())',f.ctx);
 const before=f.captures.length;await vm.runInContext('capture({id:1,url:"https://example.com/1"})',f.ctx);
 assert.equal(f.captures.length,before,'does not photograph mounted overview');
 f=fixture();await vm.runInContext('toggle()',f.ctx);
 const closer=f.browser.runtime.onMessage.listeners[0];
 await closer({type:'close-tab',id:4},{tab:f.list[0]});
 await closer({type:'close-tab',id:3},{tab:f.list[0]});
 assert.equal(f.removed.length,0,'cannot close foreign-window or hidden tabs');
 await closer({type:'close-tab',id:2},{tab:f.list[0]});
 assert.deepEqual(f.removed,[2]);assert(f.open,'closing another tab preserves overview');
 assert(f.messages.some(m=>m.type==='tab-removed'&&m.id===2));
 await closer({type:'closed'},{tab:f.list[0]});
 await closer({type:'close-tab',id:1},{tab:f.list[0]});assert.deepEqual(f.removed,[2],'no closing without active overview session');
 f=fixture();await vm.runInContext('toggle()',f.ctx);
 let settingsOpened=0;f.browser.runtime.openOptionsPage=async()=>settingsOpened++;
 await f.browser.runtime.onMessage.listeners[0]({type:'open-settings'},{tab:f.list[0]});
 assert.equal(settingsOpened,1);assert(!f.open);
 f.browser.storage.onChanged.listeners[0]({preferences:{newValue:{preload:false,blur:12}}},'local');
 assert.equal(vm.runInContext('preferences.blur',f.ctx),12);
 vm.runInContext('queueWarm(2,0)',f.ctx);assert.equal(vm.runInContext('pending.size',f.ctx),0);
 f=fixture();f.list.push(tab(5,{discarded:true,status:'unloaded',active:false}));
 let reloads=[];f.browser.tabs.reload=async id=>{reloads.push(id);const t=f.list.find(t=>t.id===id);t.discarded=false;t.status='complete';};
 await vm.runInContext('toggle()',f.ctx);
 const wakeHandler=f.browser.runtime.onMessage.listeners[0];
 assert.equal((await wakeHandler({type:'wake-preview',id:4},{tab:f.list[0]})).ok,false);
 assert.equal(reloads.length,0);
 const wake=await wakeHandler({type:'wake-preview',id:5},{tab:f.list[0]});
 assert.equal(wake.ok,true);assert.deepEqual(reloads,[5]);assert(f.open);
 assert(f.messages.some(m=>m.type==='thumbnail'&&m.id===5&&m.image));
 console.log('PASS: capture ordering; current-window/non-hidden scope; repeat toggle; sender allowlist; crosswindow guard; activate/close; protected-page handling; rapid-call guard; background preloading; overlay snapshot exclusion.');
})().catch(e=>{console.error(e);process.exitCode=1});
