/* Slipframe overlay. Idempotent injection; page strings never enter innerHTML. */
(() => {
  if (globalThis.__slipframeInstalled) return;
  globalThis.__slipframeInstalled = true;
  let host, root, tabs = [], previousFocus, focusIndex = 0, resizeObserver;
  let preferences={...SlipframeSettings.defaults};
  const el = (tag, cls, text) => {const e = document.createElement(tag); if (cls) e.className=cls; if(text)e.textContent=text;return e;};
  function cross(button){
    button.textContent='';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M4 4L12 12M12 4L4 12');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');path.setAttribute('stroke-linecap','round');svg.append(path);button.append(svg);
  }
  const send = m => browser.runtime.sendMessage(m).catch(() => {});
  const close = () => {
    if (!host) return;
    resizeObserver?.disconnect();
    host.remove(); host=null; root=null;
    document.removeEventListener('keydown', keydown, true);
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    send({type:'closed'});
  };
  function keydown(e) {
    if (!host) return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    const cards = [...root.querySelectorAll('.card')];
    const active = root.activeElement;
    if(e.key==='Tab'){
      const controls=[...root.querySelectorAll('button,.card')];
      const i=controls.indexOf(active);e.preventDefault();e.stopImmediatePropagation();
      controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length]?.focus();return;
    }
    if(active?.tagName==='INPUT') {e.stopImmediatePropagation();return;}
    const directions={ArrowRight:1,ArrowLeft:-1,ArrowDown:1,ArrowUp:-1};
    if(e.key in directions && cards.length){
      e.preventDefault();e.stopImmediatePropagation();
      let step=directions[e.key];
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        const columns=getComputedStyle(root.querySelector('.grid')).gridTemplateColumns.split(' ').length;
        step*=columns;
      }
      const i=cards.indexOf(active?.closest('.card'));focusIndex=(Math.max(i,0)+step+cards.length)%cards.length;cards[focusIndex].focus();
    }
  }
  const domain = url => {try{return new URL(url).hostname || url.split(':')[0];}catch{return 'Firefox tab';}};
  function fit(){
    if(!root)return;
    const grid=root.querySelector('.grid');
    const layout=globalThis.SlipframeLayout.fit(tabs.length,grid.clientWidth-16,grid.clientHeight-32,preferences);
    grid.style.gridTemplateColumns=`repeat(${layout.columns}, minmax(0, ${layout.width}px))`;
    grid.style.alignContent=layout.overflow?'start':'center';
  }
  function render(){
    const grid=root.querySelector('.grid');grid.replaceChildren();
    const list=tabs;
    if(!list.length){grid.append(el('div','empty','No matching tabs'));return;}
    for(const tab of list){
      const card=el('article','card'+(tab.active?' active':''));card.dataset.id=tab.id;card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',tab.title+(tab.active?', current tab':''));
      const preview=el('div','preview');
      if(tab.image){const img=el('img');img.src=tab.image;img.alt='';preview.append(img);}
      else {const blank=el('div','placeholder');blank.append(el('span','monogram',domain(tab.url).slice(0,1).toUpperCase()),el('span','preview-state',tab.discarded?'Sleeping tab':/^https?:/.test(tab.url)?'Preview loading…':'Protected page'));preview.append(blank);
        if(tab.discarded&&/^https?:/.test(tab.url)){
          const wake=el('button','wake-tab','Load preview');wake.type='button';wake.title='Wake and load this tab in the background';
          wake.addEventListener('click',e=>{e.stopPropagation();wake.disabled=true;wake.textContent='Loading…';send({type:'wake-preview',id:tab.id}).then(result=>{if(!result?.ok&&wake.isConnected){wake.disabled=false;wake.textContent='Retry preview';const label=preview.querySelector('.preview-state');if(label)label.textContent='Could not load preview';}});});preview.append(wake);
        }
      }
      if(tab.active)preview.append(el('span','badge','Current tab'));
      const label=el('span','label'), favicon=el('img','favicon');favicon.alt='';favicon.referrerPolicy='no-referrer';
      const iconURL=/^(https?:|data:image\/|moz-extension:)/i.test(tab.favicon||'')?tab.favicon:browser.runtime.getURL('icon.svg');
      favicon.src=iconURL;favicon.addEventListener('error',()=>{favicon.src=browser.runtime.getURL('icon.svg');},{once:true});
      label.append(favicon,el('span','title',(tab.pinned?'Pinned · ':'')+tab.title));
      const remove=el('button','close-tab','×');remove.type='button';remove.setAttribute('aria-label','Close tab: '+tab.title);remove.title='Close tab (middle-click also works)';
      cross(remove);
      remove.addEventListener('click',e=>{e.stopPropagation();send({type:'close-tab',id:tab.id});});
      label.append(remove);card.append(label,preview);
      card.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});
      card.addEventListener('auxclick',e=>{if(e.button===1){e.preventDefault();e.stopPropagation();send({type:'close-tab',id:tab.id});}});
      card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();send({type:'activate',id:tab.id});}});
      card.addEventListener('click',()=>send({type:'activate',id:tab.id}));grid.append(card);
    }
    fit();
  }
  function applyPreferences(value){
    preferences=SlipframeSettings.sanitize(value);
    if(!host)return;
    host.style.setProperty('--tv-blur',preferences.blur+'px');
    host.style.setProperty('--tv-dim',String(preferences.dim/100));
    host.style.setProperty('--tv-gap',preferences.gap+'px');
    fit();
  }
  function open(data,settings){
    if(host)return;
    previousFocus=document.activeElement;tabs=data;host=el('div');host.id='slipframe-overlay';
    root=host.attachShadow({mode:'closed'});
    const style=document.createElement('link');style.rel='stylesheet';style.href=browser.runtime.getURL('overview.css');root.append(style);
    const backdrop=el('div','backdrop'), shell=el('section','shell');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Tab overview');
    const exit=el('button','exit','×');exit.type='button';exit.setAttribute('aria-label','Close overview');exit.addEventListener('click',close);
    cross(exit);
    const brand=el('button','brand'),logo=el('img');brand.type='button';brand.title='Slipframe settings';brand.setAttribute('aria-label','Open Slipframe settings');logo.src=browser.runtime.getURL('icons/icon-96.png');logo.alt='';brand.append(logo,el('span','','Slipframe'));
    brand.addEventListener('click',()=>send({type:'open-settings'}));
    shell.append(brand,exit,el('div','grid'));
    shell.addEventListener('click',e=>{if(e.target===shell||e.target.classList.contains('grid'))close();});
    backdrop.addEventListener('click',close);root.append(backdrop,shell);document.documentElement.append(host);
    document.addEventListener('keydown',keydown,true);applyPreferences(settings);render();
    resizeObserver=new ResizeObserver(fit);resizeObserver.observe(root.querySelector('.grid'));
    style.addEventListener('load',fit);
    root.querySelector('.card.active, .card')?.focus({preventScroll:true});
  }
  browser.runtime.onMessage.addListener(m=>{
    if(m.type==='status')return Promise.resolve({open:!!host});
    if(m.type==='open'){open(m.tabs,m.preferences);return Promise.resolve({ok:true});}
    if(m.type==='preferences'&&host)applyPreferences(m.preferences);
    if(m.type==='close'){close();return Promise.resolve({ok:true});}
    if(m.type==='tab-removed'&&host){
      const index=tabs.findIndex(t=>t.id===m.id);if(index<0)return;
      const focused=root.activeElement?.closest('.card')?.dataset.id===String(m.id);
      tabs=tabs.filter(t=>t.id!==m.id);root.querySelector(`.card[data-id="${m.id}"]`)?.remove();
      if(!tabs.length){close();return;}
      fit();if(focused)root.querySelectorAll('.card')[Math.min(index,tabs.length-1)]?.focus({preventScroll:true});
    }
    if(m.type==='thumbnail'&&host){
      const tab=tabs.find(t=>t.id===m.id);if(!tab)return;tab.image=m.image;
      const preview=root.querySelector(`.card[data-id="${m.id}"] .preview`);if(!preview)return;
      if(!m.image){const label=preview.querySelector('.preview-state');if(label)label.textContent='Preview unavailable';return;}
      preview.querySelector('.placeholder')?.remove();preview.querySelector('.wake-tab')?.remove();let img=preview.querySelector('img');if(!img){img=el('img');img.alt='';preview.prepend(img);}img.src=m.image;
    }
  });
})();
