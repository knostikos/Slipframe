/* Slipframe 0.99 — event-driven local snapshot preloading; no network or disk cache. */
const GESTUREFY = "{506e023c-7f2b-40a3-8066-bc5deb40aebe}";
let preferences = {...SlipframeSettings.defaults};
const settingsReady = browser.storage.local.get('preferences').then(data => {
  preferences = SlipframeSettings.sanitize(data.preferences);
}).catch(() => {});
const cache = new Map();
const sessions = new Map();
const busy = new Set();
const pending = new Map();
let warmTimer = null, warming = false;
function queueWarm(id, delay = 1200) {
  if (!preferences.preload) return;
  pending.set(id, Date.now() + delay);
  if (!warmTimer) warmTimer = setTimeout(warmNext, delay);
}
async function warmNext() {
  warmTimer = null;
  if (warming || !pending.size || !preferences.preload) return;
  // Never photograph an overview, and avoid competing with its capture queue.
  if (sessions.size || busy.size) {warmTimer = setTimeout(warmNext, 1000); return;}
  const entry = [...pending].find(([, due]) => due <= Date.now());
  if (!entry) {warmTimer = setTimeout(warmNext, 600); return;}
  const [id] = entry; pending.delete(id); warming = true;
  try {
    const t = await browser.tabs.get(id);
    if (!t.hidden && eligible(t) && t.status !== "loading") await capture(t);
  } catch (_) {} finally {
    warming = false;
    if (pending.size && !warmTimer) warmTimer = setTimeout(warmNext, 700);
  }
}
const eligible = t => /^https?:/.test(t.url || "") && !t.discarded;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function capture(t) {
  if (!eligible(t) || sessions.has(t.id)) return null;
  try {
    const live = await browser.tabs.get(t.id);
    if (live.url !== t.url || live.discarded) return null;
    const url = await browser.tabs.captureTab(t.id, {format: "jpeg", quality: 55, scale: 0.35});
    cache.delete(t.id);
    cache.set(t.id, {url, page: t.url, time: Date.now()});
    // Memory bound; no thumbnails survive extension/browser shutdown.
    while (cache.size > 120) cache.delete(cache.keys().next().value);
    return url;
  } catch (_) { return null; }
}
function describe(t) {
  const c = cache.get(t.id);
  return {id: t.id, title: t.title || "Untitled tab", url: t.url || "", active: t.active,
    pinned: t.pinned, discarded: t.discarded, audible: t.audible,
    favicon: t.favIconUrl || null, image: c?.page === t.url ? c.url : null};
}
async function tell(tabId, message) {
  return browser.tabs.sendMessage(tabId, message, {frameId: 0});
}
async function warn() {
  await browser.notifications.create({type: "basic", iconUrl: browser.runtime.getURL("icons/icon-96.png"),
    title: "Slipframe can't overlay this page", message: "Firefox protects this page from extensions. Switch to an ordinary website and try again."});
}
async function stream(owner, token, tabs) {
  for (const tab of tabs) {
    if (sessions.get(owner) !== token) return;
    if (tab.id === owner || !eligible(tab)) continue;
    const c = cache.get(tab.id);
    if (c?.page === tab.url && Date.now() - c.time < 60000) continue;
    await sleep(550);
    if (sessions.get(owner) !== token) return;
    const image = await capture(tab);
    if (sessions.get(owner) !== token) return;
    await tell(owner, {type: "thumbnail", id: tab.id, image}).catch(() => {});
  }
}
async function toggle() {
  await settingsReady;
  const [tab] = await browser.tabs.query({active: true, currentWindow: true});
  if (!tab || busy.has(tab.id)) return {ok: false};
  busy.add(tab.id);
  try {
    let status;
    try { status = await tell(tab.id, {type: "status"}); } catch (_) {}
    if (status?.open) {
      sessions.delete(tab.id);
      await tell(tab.id, {type: "close"});
      return {ok: true, open: false};
    }
    if (!status) {
      await browser.tabs.executeScript(tab.id, {file: "settings.js", frameId: 0});
      await browser.tabs.executeScript(tab.id, {file: "layout.js", frameId: 0});
      await browser.tabs.executeScript(tab.id, {file: "overlay.js", frameId: 0});
    }
    // Capture the current page BEFORE displaying the overlay (no recursion).
    // A warm image makes opening immediate. Missing previews fill in after mount.
    const ready = cache.get(tab.id);
    if (!ready || ready.page !== tab.url || Date.now()-ready.time > 60000) await capture(tab);
    const tabs = (await browser.tabs.query({windowId: tab.windowId})).filter(t => !t.hidden);
    const token = Symbol();
    sessions.set(tab.id, token);
    await tell(tab.id, {type: "open", tabs: tabs.map(describe), preferences});
    stream(tab.id, token, tabs).catch(() => {});
    return {ok: true, open: true};
  } catch (_) {
    sessions.delete(tab.id);
    await warn().catch(() => {});
    return {ok: false, reason: "page-unavailable"};
  } finally { busy.delete(tab.id); }
}
browser.browserAction.onClicked.addListener(toggle);
browser.commands.onCommand.addListener(c => { if (c === "toggle-overview") toggle(); });
browser.runtime.onMessageExternal.addListener((m, sender) => {
  if (sender.id !== GESTUREFY || m?.action !== "toggle") return Promise.resolve({ok: false});
  return toggle();
});
browser.runtime.onMessage.addListener(async (m, sender) => {
  if (!sender.tab) return;
  const owner = sender.tab.id;
  if (m.type === "closed") { sessions.delete(owner); queueWarm(owner, 1000); return; }
  if (!sessions.has(owner)) return;
  if (m.type === "wake-preview" && Number.isInteger(m.id)) {
    const token=sessions.get(owner);
    try {
      let target=await browser.tabs.get(m.id);
      if(target.windowId!==sender.tab.windowId||target.hidden||!/^https?:/.test(target.url||'')||target.id===owner)return {ok:false};
      if(target.discarded)await browser.tabs.reload(target.id);
      for(let attempt=0;attempt<30;attempt++){
        if(sessions.get(owner)!==token)return {ok:false};
        target=await browser.tabs.get(m.id);
        if(target.windowId!==sender.tab.windowId||target.hidden)return {ok:false};
        if(!target.discarded&&target.status==='complete'){
          const image=await capture(target);
          if(sessions.get(owner)!==token)return {ok:false};
          if(image)await tell(owner,{type:'thumbnail',id:target.id,image});
          return {ok:!!image};
        }
        await sleep(500);
      }
    }catch(_){}
    return {ok:false};
  }
  if (m.type === "open-settings") {
    await browser.runtime.openOptionsPage();
    sessions.delete(owner);
    await tell(owner, {type:"close"}).catch(() => {});
    return {ok:true};
  }
  if (m.type === "close-tab" && Number.isInteger(m.id)) {
    const target = await browser.tabs.get(m.id);
    if (target.windowId !== sender.tab.windowId || target.hidden) return;
    await browser.tabs.remove(m.id);
    return {ok: true};
  }
  if (m.type === "activate" && Number.isInteger(m.id)) {
    const target = await browser.tabs.get(m.id);
    if (target.windowId !== sender.tab.windowId || target.hidden) return;
    sessions.delete(owner);
    await tell(owner, {type: "close"}).catch(() => {});
    await browser.tabs.update(m.id, {active: true});
  }
});
browser.tabs.onRemoved.addListener(id => {
  cache.delete(id); sessions.delete(id); pending.delete(id);
  for (const owner of sessions.keys()) tell(owner, {type: "tab-removed", id}).catch(() => {});
});
browser.tabs.onUpdated.addListener((id, change) => {
  if (change.url) cache.delete(id);
  if (change.url || change.status === "loading") sessions.delete(id);
  if (change.status === "complete") queueWarm(id);
});
browser.tabs.onActivated.addListener(async ({tabId, windowId}) => {
  // Dismiss the old page's overview if the user switches through native UI.
  for (const id of [...sessions.keys()]) {
    if (id === tabId) continue;
    try {if ((await browser.tabs.get(id)).windowId === windowId) {
      sessions.delete(id); await tell(id, {type: "close"}).catch(() => {});
    }} catch (_) {sessions.delete(id);}
  }
  queueWarm(tabId, 1500);
});
browser.tabs.onCreated.addListener(t => {if (!t.discarded && !t.hidden) queueWarm(t.id, 2000);});
// Preload already-open, loaded website tabs once when the extension starts.
settingsReady.then(() => browser.tabs.query({})).then(tabs => {
  for (const t of tabs) if (eligible(t) && !t.hidden) queueWarm(t.id, 1500);
}).catch(() => {});
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.preferences) return;
  const previous = preferences;
  preferences = SlipframeSettings.sanitize(changes.preferences.newValue);
  if (!preferences.preload) {pending.clear(); if(warmTimer)clearTimeout(warmTimer); warmTimer=null;}
  if (!previous.preload && preferences.preload) browser.tabs.query({}).then(tabs => {
    for(const t of tabs)if(eligible(t)&&!t.hidden)queueWarm(t.id);
  }).catch(()=>{});
  for(const owner of sessions.keys())tell(owner,{type:'preferences',preferences}).catch(()=>{});
});
