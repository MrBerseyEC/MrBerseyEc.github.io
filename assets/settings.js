/* Site settings: a gear button on every page that opens a small panel. Choices are kept in localStorage, so they stick between pages and visits.
   To add a setting: give it a default in DEFAULTS, add a row in the PANEL list, and read it anywhere with settings.get('key'). */
const settings=(()=>{
  const KEY='htb-settings',DEFAULTS={fullscreen:'screen',theme:'auto'};
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
  const get=k=>saved[k]===undefined?DEFAULTS[k]:saved[k];
  /* theme: 'auto' follows the device; light and dark set data-theme on <html>, which site.css reads. Applied now, before first paint, to avoid a flash */
  const applyTheme=()=>{const t=get('theme'),r=document.documentElement;t==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',t);r.style.colorScheme=t==='auto'?'':t;dispatchEvent(new Event('themechange'))};
  const set=(k,v)=>{saved[k]=v;try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}if(k==='theme')applyTheme()};
  applyTheme();
  /* one row per setting: key, label, help text, and the choices as [value,label] */
  const PANEL=[{key:'theme',label:'Theme',
    opts:[['auto','Auto'],['light','Light'],['dark','Dark']],
    help:{auto:'Matches your device setting.',light:'Always light.',dark:'Always dark.'}},
  {key:'fullscreen',label:'Full screen mode',
    opts:[['screen','Whole screen'],['window','In window']],
    help:{screen:'Fills your whole display and hides the browser, like a video.',window:'Fills the browser window only. The tabs and address bar stay visible.'}}];
  document.addEventListener('DOMContentLoaded',()=>{
    const d=document,btn=d.createElement('button'),pop=d.createElement('div');
    btn.className='gear';btn.type='button';btn.setAttribute('aria-label','Settings');btn.setAttribute('aria-expanded','false');btn.textContent='⚙';
    pop.className='settings hidden';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Settings');
    const draw=()=>{pop.innerHTML='<h2>Settings</h2>'+PANEL.map(s=>`<div class="srow"><div class="slab">${s.label}</div><div class="seg" role="group" aria-label="${s.label}">${s.opts.map(([v,l])=>`<button type="button" data-k="${s.key}" data-v="${v}" aria-pressed="${get(s.key)===v}">${l}</button>`).join('')}</div><p class="shelp">${s.help[get(s.key)]||''}</p></div>`).join('')};
    const toggle=on=>{pop.classList.toggle('hidden',!on);btn.setAttribute('aria-expanded',on)};
    btn.onclick=()=>toggle(pop.classList.contains('hidden'));
    pop.onclick=e=>{const b=e.target.closest('[data-k]');if(b){set(b.dataset.k,b.dataset.v);draw()}};
    d.addEventListener('click',e=>{if(!pop.contains(e.target)&&e.target!==btn)toggle(false)});
    d.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.classList.contains('hidden')){toggle(false);btn.focus()}});
    draw();d.body.append(btn,pop);
  });
  return{get,set};
})();
