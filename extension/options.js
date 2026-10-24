/* Native extension options. Changes are serialized to avoid slider save races. */
const fields=Object.keys(SlipframeSettings.defaults);
let prefs, writes=Promise.resolve(), revision=0;
const status=document.getElementById('status');
function paint(){
  for(const k of fields){const input=document.getElementById(k);if(input.type==='checkbox')input.checked=prefs[k];else input.value=prefs[k];}
  for(const k of ['tileWidth','blur','dim','gap'])document.querySelector(`output[for="${k}"]`).textContent=prefs[k]+(k==='dim'?'%':'px');
  document.getElementById('size-help').textContent=prefs.layout==='fit'?'Maximum card width in Fit mode.':'Preferred card width; extra tabs scroll.';
}
function save(){
  const current=++revision, snapshot={...prefs};status.textContent='Saving…';
  writes=writes.catch(()=>{}).then(()=>browser.storage.local.set({preferences:snapshot})).then(()=>{if(current===revision)status.textContent='Saved';}).catch(()=>{if(current===revision)status.textContent='Could not save — try again';});
}
(async()=>{
  prefs=SlipframeSettings.sanitize((await browser.storage.local.get('preferences')).preferences);paint();
  for(const k of fields)document.getElementById(k).addEventListener('input',e=>{const input=e.target;prefs=SlipframeSettings.sanitize({...prefs,[k]:input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value});paint();save();});
  document.getElementById('reset').addEventListener('click',()=>{prefs={...SlipframeSettings.defaults};paint();save();});
  document.getElementById('recipient').textContent=browser.runtime.id;
  const command=(await browser.commands.getAll()).find(c=>c.name==='toggle-overview');
  document.getElementById('shortcut').textContent=command?.shortcut||'Not assigned';
})().catch(()=>{status.textContent='Could not load settings — reload this page';});

let recording=false;
const shortcutStatus=document.getElementById('shortcut-status');
async function refreshShortcut(){
  const c=(await browser.commands.getAll()).find(c=>c.name==='toggle-overview');
  document.getElementById('shortcut').textContent=c?.shortcut||'Not assigned';
}
document.getElementById('change-shortcut').addEventListener('click',()=>{
  recording=true;document.getElementById('change-shortcut').textContent='Press shortcut…';
  shortcutStatus.textContent='Press your new shortcut. Escape cancels. F2 stays reserved for immersive mode.';
});
document.addEventListener('keydown',async e=>{
  if(!recording)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.key==='Escape'){recording=false;shortcutStatus.textContent='Cancelled.';document.getElementById('change-shortcut').textContent='Change hotkey';return;}
  const shortcut=SlipframeHotkey.fromEvent(e);if(!shortcut)return;
  if(shortcut==='F2'){shortcutStatus.textContent='F2 is reserved for immersive mode. Choose another shortcut.';return;}
  recording=false;document.getElementById('change-shortcut').textContent='Change hotkey';
  try{await browser.commands.update({name:'toggle-overview',shortcut});await refreshShortcut();shortcutStatus.textContent='Saved. Test it on an ordinary website; Firefox may reserve conflicting shortcuts.';}
  catch(_){shortcutStatus.textContent='Firefox did not accept that shortcut. Try another combination.';}
},true);
document.getElementById('reset-shortcut').addEventListener('click',async()=>{
  recording=false;document.getElementById('change-shortcut').textContent='Change hotkey';
  try{await browser.commands.reset('toggle-overview');await refreshShortcut();shortcutStatus.textContent='Default hotkey restored.';}catch(_){shortcutStatus.textContent='Could not reset the hotkey.';}
});
async function copy(text){
  try{await navigator.clipboard.writeText(text);}
  catch(_){const field=document.createElement('textarea');field.value=text;document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw Error('copy');}
}
for(const [id,value] of [['copy-recipient',()=>browser.runtime.id],['copy-message',()=>JSON.stringify({action:'toggle'})],['copy-addon-manager',()=> 'about:addons']]){
  document.getElementById(id).addEventListener('click',async()=>{
    try{await copy(value());document.getElementById('copy-status').textContent='Copied.';}catch(_){document.getElementById('copy-status').textContent='Copy unavailable. Select and copy the text manually.';}
  });
}
document.getElementById('get-gesturefy').addEventListener('click',()=>browser.tabs.create({url:'https://addons.mozilla.org/firefox/addon/gesturefy/'}).catch(()=>{document.getElementById('copy-status').textContent='Visit addons.mozilla.org and search Gesturefy.';}));

// Firefox blocks extension navigation to privileged setup pages. Copy only the address.
document.getElementById('copy-support').addEventListener('click',async()=>{
  const message=document.getElementById('setup-status');
  try{
    await copy('about:support');
    message.textContent='Copied. Paste into the address bar and press Enter, then choose Profile Folder → Open Folder.';
  }catch(_){message.textContent='Type about:support in the address bar, then choose Profile Folder → Open Folder.';}
});
