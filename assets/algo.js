/* Shared player for the OCR 2.3 algorithm demos. Load with `algo: true` in the page's front matter.
   A page calls algoDemo(cfg) once. It needs the markup from _includes/algo-demo.html and _includes/algo-bigo.html.

   cfg = {
     kind:   'sort' | 'search'
     ocr, swift:  arrays of source lines (the lines the demo highlights)
     flows:  [{title, w, h, nodes, arrows}]  arguments for flow() in site.js, with an id on every node the demo highlights
     run:    function*(X) that does the algorithm on X.a (and X.t, the target, for searches) and yields X.S(...) after each step
     cLabel, wLabel:  names for the two counters (wLabel is optional)
     bigO:   {best, avg, worst, space}   shown in the table
     why:    [html]  reasons for those figures
     refs:   which curves to draw against the measured results: 'n', 'nlogn', 'n2', 'logn'
     key:    html for the colour key under the chart (optional)
     tree:   true for merge sort: in card view the list is drawn as a divide-then-merge tree (see treeHTML). Steps then carry extra.tree
     needsSorted: true for a binary search, which warns when the list is not in order
     best:   (sorted array) => the target that gives the best case (searches only)
   }
   X.S(message, ocrLines, swiftLines, flowNodes, extra) builds one step. ocrLines, swiftLines and flowNodes may be a single value or a list.
   extra may hold:  k {index: class}   ov {index: value shown instead}   p [[index, label]]   rng [low, high]   v {name: value}   tmp [values]   x text
   X.c and X.w are the two counters. The generator adds to them. */
const SUITS=['\u2660','\u2665','\u2666','\u2663'];
const face=v=>({1:'A',11:'J',12:'Q',13:'K'})[v]||v;
const suit=v=>{const i=((v%4)+4)%4;return`<em class="pip${i===1||i===2?' red':''}">${SUITS[i]}</em>`};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const log2=n=>Math.log(n)/Math.LN2;

/* The tree a merge sort splits a list of n items into: {nodes:[{lo,hi,d,side,leaf,kids}], depth}. Used by the merge sort demo and by treeHTML(). */
const _splitCache={};
function splitTree(n){
  if(_splitCache[n])return _splitCache[n];
  const nodes=[];let depth=0;
  (function go(lo,hi,d,side){
    const z={lo,hi,d,side,leaf:lo===hi};nodes.push(z);depth=Math.max(depth,d);
    if(lo<hi){const mid=(lo+hi)>>1;z.kids=[go(lo,mid,d+1,'L'),go(mid+1,hi,d+1,'R')]}
    return z})(0,n-1,0,'');
  return _splitCache[n]={nodes,depth};
}

function algoDemo(cfg){
  const isS=cfg.kind==='search';
  const maxN=isS?12:13; /* a suit of cards runs from Ace (1) to King (13), so there are at most 13 different values */
  let data=[],target=0,steps=[],idx=0,timer=null,view='cards',prevVals=null,prevIdx=0;
  try{if(localStorage.getItem('algoView')==='bars')view='bars'}catch(e){}
  const q=id=>document.getElementById(id);
  const list=v=>v===undefined||v===null?[]:[].concat(v);

  /* ---------- data ---------- */
  function unique(n){const s=new Set();while(s.size<n)s.add(rnd(1,13));return[...s]}
  function make(type,n){
    let a=unique(n);
    if(type==='sorted'||type==='nearly'||type==='rev'||isS&&type==='sortedS')a.sort((x,y)=>x-y);
    if(type==='rev')a.reverse();
    if(type==='nearly'){for(let t=0;t<2;t++){const i=rnd(0,n-2);[a[i],a[i+1]]=[a[i+1],a[i]]}}
    return a;
  }

  /* ---------- steps ---------- */
  function newX(a,t,fast){
    const X={a:a.slice(),t,c:0,w:0,fast};
    X.S=(m,o,s,f,e)=>fast?null:Object.assign({m,o:list(o),s:list(s),f:list(f),a:X.a.slice(),c:X.c,w:X.w},e);
    return X;
  }
  function build(){
    const X=newX(data,target,false);
    const first={m:isS?`Looking for <b>${target}</b> in the list. Press <b>Play</b> or <b>Step</b>.`:'Press <b>Play</b> to watch the algorithm, or <b>Step</b> to go one step at a time.',o:[],s:[],f:[],a:data.slice(),c:0,w:0};
    if(cfg.needsSorted&&data.some((v,i)=>i&&v<data[i-1]))first.m+='<br><b class="badc">This list is not sorted, so a binary search cannot be trusted. Try it anyway to see what goes wrong.</b>';
    steps=[first];
    for(const st of cfg.run(X)){steps.push(st);if(steps.length>6000)break}
    idx=0;prevVals=null;draw();
  }

  /* ---------- drawing ---------- */
  /* Slide each card from where it was to where it is now. Cards are matched up by value, so a swap shows the two cards passing over each other. */
  function flip(prev,cur){
    if(prev.length!==cur.length||window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const blank=v=>v===null||v===undefined||v==='',used=[],from=[];
    cur.forEach((v,i)=>{if(!blank(v)&&prev[i]===v){used[i]=true;from[i]=i}});
    cur.forEach((v,i)=>{if(blank(v)||from[i]!==undefined)return;const j=prev.findIndex((p,x)=>!used[x]&&p===v);if(j>=0){used[j]=true;from[i]=j}});
    const kids=q('ad-cells').children,dur=Math.max(120,Math.min(480,delay()*.75));
    cur.forEach((v,i)=>{
      const j=from[i];if(j===undefined||j===i||!kids[i])return;
      const el=kids[i].firstElementChild,dx=(j-i)*50,lift=(dx>0?-1:1)*Math.min(30,12+Math.abs(j-i)*6);
      el.style.position='relative';el.style.zIndex=2;
      el.animate([{transform:`translate(${dx}px,0)`},{transform:`translate(${dx/2}px,${lift}px)`,offset:.5},{transform:'none'}],{duration:dur,easing:'ease-in-out'});
    });
  }
  /* Merge sort as a tree: the divide stage on top (each row is one level of splitting), the merge stage underneath
     (the same rows in reverse, so the finished list is at the bottom). Each node sits over the original positions it covers.
     st.tree = {dd: deepest level shown in the divide stage, mg: merge stage started, done: {'lo-hi': merged values}, act: {lo,hi,tmp} the merge in progress} */
  function treeHTML(st){
    const PW=48,CH=58,RH=74,n=data.length,tr=splitTree(n),D=tr.depth,W=n*PW-6;
    const T=st.tree||{dd:0,mg:false,done:{},act:null},k=st.k||{},act=T.act,pt={};
    (st.p||[]).forEach(([i,l])=>(pt[i]=pt[i]||[]).push(l));
    const dTop=24,capM=dTop+D*RH+CH+14,mTop=capM+26,H=mTop+D*RH+CH+2;
    const dY=z=>dTop+z.d*RH,mY=z=>mTop+(D-z.d)*RH,cx=z=>z.lo*PW+((z.hi-z.lo+1)*PW-6)/2;
    const card=(v,cl,g)=>`<span class="${cl}">${v===null?'':suit(v)+face(v)}${pt[g]?`<sup>${pt[g].join(' ')}</sup>`:''}</span>`;
    const node=(z,y,vals,cl,cls,ptr)=>`<div class="tn ${cls}" style="left:${z.lo*PW}px;top:${y}px;width:${(z.hi-z.lo+1)*PW-6}px">${vals.map((v,i)=>card(v,cl(i),ptr?z.lo+i:-1)).join('')}</div>`;
    const key=z=>z.lo+'-'+z.hi,isAct=z=>act&&act.lo===z.lo&&act.hi===z.hi;
    const mvals=z=>z.leaf?[data[z.lo]]:T.done[key(z)]||(isAct(z)?act.tmp:null);
    let html=`<div class="tree-in" style="width:${W}px;height:${H}px"><div class="tcap" style="top:0">1 · DIVIDE: split in half until every part has one item</div><div class="tcap" style="top:${capM}px">2 · MERGE: join the sorted parts back together, in order</div>`;
    let ar='';
    const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#ah)"/>`;
    for(const z of tr.nodes){
      if(z.d<=T.dd){
        const tint=!T.mg&&z.d===T.dd&&z.d>0?z.side:'';
        html+=node(z,dY(z),data.slice(z.lo,z.hi+1),()=>tint,isAct(z)?'on':T.mg?'dim':'');
        if(z.kids&&z.kids[0].d<=T.dd)z.kids.forEach(c=>ar+=line(cx(z),dY(z)+CH+1,cx(c),dY(c)-3));
      }
      const v=T.mg&&mvals(z);
      if(v){
        const dim=st.rng&&(z.hi<st.rng[0]||z.lo>st.rng[1]);
        html+=node(z,mY(z),v,isAct(z)?(i=>v[i]===null?'hole':''):(i=>k[z.lo+i]||''),(isAct(z)?'on ':'')+(dim?'dim':''),true);
        if(z.kids)z.kids.forEach(c=>{if(mvals(c))ar+=line(cx(c),mY(c)+CH+1,cx(z),mY(z)-3)});
      }
    }
    return html+`<svg class="tn-ar" width="${W}" height="${H}" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="currentColor"/></marker></defs>${ar}</svg></div>`;
  }

  function draw(){
    const st=steps[idx],a=st.a;
    const max=Math.max(...data,1);
    const k=st.k||{},ov=st.ov||{};
    const ptr={};(st.p||[]).forEach(([i,l])=>{if(i>=0&&i<a.length)(ptr[i]=ptr[i]||[]).push(l)});
    const cards=isS||view==='cards',tree=cfg.tree&&!isS&&cards;
    q('ad-cells').className='cells'+(cards?' cards':'');
    if(tree)q('ad-cells').innerHTML=treeHTML(st);
    else q('ad-cells').innerHTML=a.map((v0,i)=>{
      const v=i in ov?ov[i]:v0;let cl=k[i]||'';
      if(st.rng&&(i<st.rng[0]||i>st.rng[1])&&!/sorted|found/.test(cl))cl+=' dim';
      const body=cards?`<div class="box ${cl}">${suit(v)}${face(v)}${suit(v)}</div>`:`<div class="bar ${cl}" style="height:${Math.max(14,v/max*100)}%">${v}</div>`;
      return`<div class="cell"><div class="barwrap">${body}</div><div class="idx">${i}</div><div class="ptr">${(ptr[i]||[]).join(' ')}</div></div>`}).join('');
    const vals=a.map((v0,i)=>i in ov?ov[i]:v0);
    if(!tree&&prevVals&&Math.abs(idx-prevIdx)===1)flip(prevVals,vals);
    prevVals=tree?null:vals;prevIdx=idx;
    const tmp=q('ad-tmp');
    if(st.tmp&&!tree){tmp.innerHTML='<b>temp</b>'+st.tmp.map(v=>`<span class="${v===null?'':'f'}">${v===null?'':v}</span>`).join('');tmp.classList.remove('hidden')}else tmp.classList.add('hidden');
    q('ad-x').textContent=st.x||'';
    q('ad-msg').innerHTML=st.m;
    q('ad-vars').innerHTML=Object.entries(st.v||{}).map(([n,v])=>`<span>${n} = ${v}</span>`).join('');
    q('ad-count').innerHTML=`${cfg.cLabel}: <b>${st.c}</b>`+(cfg.wLabel?` &nbsp; ${cfg.wLabel}: <b>${st.w}</b>`:'')+`<br>Step <b>${idx}</b> of ${steps.length-1}`;
    [['ad-ocr',st.o],['ad-swift',st.s]].forEach(([id,ls])=>{
      const pre=q(id);[...pre.children].forEach((s,i)=>s.classList.toggle('cur',ls.includes(i)));
      const first=pre.children[ls[0]];if(first&&pre.offsetParent){const top=first.offsetTop-pre.clientHeight/3;pre.scrollTop=Math.max(0,top)}});
    document.querySelectorAll('#ad-flows g[data-n]').forEach(g=>g.classList.toggle('on',st.f.includes(g.dataset.n)));
    q('ad-back').disabled=idx===0;q('ad-step').disabled=idx>=steps.length-1;
    q('ad-play').textContent=timer?'⏸ Pause':'▶ Play';
    const sc=q('ad-scrub');sc.max=steps.length-1;sc.value=idx;
  }
  const delay=()=>Math.max(60,1150-q('ad-speed').value*100);
  function pause(){clearTimeout(timer);timer=null}
  function tick(){if(idx>=steps.length-1){pause();draw();return}idx++;draw();timer=setTimeout(tick,delay())}
  q('ad-play').onclick=()=>{if(timer){pause();draw();return}if(idx>=steps.length-1)idx=0;timer=setTimeout(tick,0);draw()};
  q('ad-step').onclick=()=>{pause();if(idx<steps.length-1)idx++;draw()};
  q('ad-back').onclick=()=>{pause();if(idx>0)idx--;draw()};
  q('ad-reset').onclick=()=>{pause();idx=0;draw()};
  q('ad-scrub').oninput=e=>{pause();idx=Math.min(steps.length-1,Math.max(0,+e.target.value));draw()};
  /* keyboard: Space play/pause, arrows step, R reset. Ignored while typing, or when a button/slider has focus and would use the key itself */
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const t=e.target,tag=t.tagName;
    if(tag==='TEXTAREA'||tag==='SELECT'||t.isContentEditable||tag==='INPUT'&&t.type!=='range')return;
    if(e.key===' '||e.key==='Spacebar'){if(tag==='BUTTON'||tag==='A')return;e.preventDefault();q('ad-play').click()}
    else if(e.key==='ArrowRight'&&tag!=='INPUT'){e.preventDefault();q('ad-step').click()}
    else if(e.key==='ArrowLeft'&&tag!=='INPUT'){e.preventDefault();q('ad-back').click()}
    else if(e.key==='r'||e.key==='R'){q('ad-reset').click()}
  });

  /* ---------- cards or bars ---------- */
  const vw=q('ad-view');
  if(isS)vw.classList.add('hidden');
  else{
    const sync=()=>vw.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===view));
    vw.querySelectorAll('button').forEach(b=>b.onclick=()=>{view=b.dataset.v;try{localStorage.setItem('algoView',view)}catch(e){}sync();draw()});
    sync();
  }

  /* ---------- setting up the data ---------- */
  if(cfg.key)q('ad-key').innerHTML=cfg.key;
  q('ad-key').insertAdjacentHTML('beforeend','<span>Values run from Ace = 1 to King = 13: Jack = 11, Queen = 12</span>');
  const setup=q('ad-setup');
  const opts=isS?[['random','Unsorted'],['sortedS','Sorted']]:[['random','Random'],['nearly','Nearly sorted'],['rev','Reversed'],['sorted','Already sorted'],['custom','Type your own']];
  setup.innerHTML=`<label>List <select id="ad-data">${opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>
    <label>Items <input type="range" id="ad-n" min="${isS?6:4}" max="${maxN}" value="${isS?12:10}"> <b class="mono" id="ad-nv"></b></label>
    <button class="btn" id="ad-new">New data</button><button class="btn" id="ad-share">Copy link</button>
    ${isS?`<label>Target <input type="number" id="ad-t" min="1" max="13" style="width:5.5em"></label><button class="btn" id="ad-tin">Pick one in the list</button><button class="btn" id="ad-tout">Pick one not in the list</button>`
         :`<span id="ad-cust" class="hidden"><input type="text" id="ad-ctext" placeholder="e.g. 8, 3, 5, 1" size="22" aria-label="Numbers separated by commas"> <button class="btn" id="ad-cgo">Use these</button></span>`}
    <span class="status" id="ad-err" style="margin:0"></span>`;
  const type=()=>q('ad-data').value;
  function fresh(){
    pause();q('ad-nv').textContent=q('ad-n').value;q('ad-err').textContent='';
    if(!isS&&type()==='custom'){q('ad-cust').classList.remove('hidden');if(!q('ad-ctext').value)q('ad-ctext').value=data.join(', ');return}
    if(!isS)q('ad-cust').classList.add('hidden');
    data=make(type(),+q('ad-n').value);
    if(isS){target=data[rnd(0,data.length-1)];q('ad-t').value=target}
    build();
  }
  q('ad-data').onchange=fresh;q('ad-n').oninput=fresh;q('ad-new').onclick=()=>{if(!isS&&type()==='custom')return;fresh()};
  if(isS){
    q('ad-t').oninput=()=>{const v=parseInt(q('ad-t').value,10);if(isNaN(v))return;pause();target=v;build()};
    q('ad-tin').onclick=()=>{pause();target=data[rnd(0,data.length-1)];q('ad-t').value=target;build()};
    q('ad-tout').onclick=()=>{pause();let v;do{v=rnd(1,13)}while(data.includes(v));target=v;q('ad-t').value=v;build()};
  }else{
    q('ad-cgo').onclick=()=>{
      const nums=q('ad-ctext').value.split(/[\s,]+/).filter(Boolean).map(Number);
      if(nums.length<2||nums.length>maxN||nums.some(v=>!Number.isInteger(v)||v<1||v>13)){q('ad-err').textContent=`Enter between 2 and ${maxN} whole numbers from 1 to 13 (Ace = 1, Jack = 11, Queen = 12, King = 13), separated by commas.`;return}
      q('ad-err').textContent='';pause();data=nums;build();
    };
    q('ad-ctext').onkeydown=e=>{if(e.key==='Enter')q('ad-cgo').click()};
  }

  /* ---------- code and flowcharts ---------- */
  listing(q('ad-ocr'),cfg.ocr);listing(q('ad-swift'),cfg.swift);
  tabs(q('ad-codetabs').parentElement);
  q('ad-flows').innerHTML=cfg.flows.map((f,i)=>`<div class="flowbox"><h3${f.title?'':' class="hidden"'}>${f.title||''}</h3><div id="ad-flow${i}" data-label="Flowchart: ${f.title||'the algorithm'}"></div></div>`).join('');
  cfg.flows.forEach((f,i)=>flow(q('ad-flow'+i),f.w,f.h,f.nodes,f.arrows));

  /* ---------- Big O ---------- */
  const bo=cfg.bigO;
  q('ad-bo-facts').innerHTML=[['Best case time',bo.best],['Average case time',bo.avg],['Worst case time',bo.worst],['Space',bo.space]].map(([l,v])=>`<div class="fact"><small>${l}</small><b>${v}</b></div>`).join('');
  q('ad-bo-why').innerHTML=cfg.why.map(w=>`<li>${w}</li>`).join('');
  const modes=isS?[['worst','Worst case: the target is not in the list'],['best','Best case: the target is found first time'],['avg','Average: a target chosen at random from the list']]
                 :[['random','Random order'],['sorted','Already sorted'],['rev','Reversed']];
  const sizes=isS?[16,32,64,128,256,512,1024]:[8,16,32,64,128];
  q('ad-bo-mode').innerHTML=modes.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('');
  const REF={n:{name:'n',f:n=>n,col:'var(--ok)'},nlogn:{name:'n log₂ n',f:n=>n*log2(n),col:'var(--hl)'},n2:{name:'n²',f:n=>n*n,col:'var(--bad)'},logn:{name:'log₂ n',f:n=>log2(n),col:'var(--hl)'}};
  function measure(mode,n){
    if(!isS){
      const trials=mode==='random'?20:1;let c=0,w=0;
      for(let t=0;t<trials;t++){
        const a=Array.from({length:n},()=>rnd(1,100000));
        if(mode!=='random')a.sort((x,y)=>x-y);
        if(mode==='rev')a.reverse();
        const X=newX(a,0,true);for(const _ of cfg.run(X));c+=X.c;w+=X.w}
      return{c:Math.round(c/trials),w:Math.round(w/trials)};
    }
    const a=Array.from({length:n},(_,i)=>2*i+1);
    const go=t=>{const X=newX(a,t,true);for(const _ of cfg.run(X));return X.c};
    if(mode==='worst')return{c:go(2*n)};
    if(mode==='best')return{c:go(cfg.best(a))};
    let c=0;const T=200;for(let t=0;t<T;t++)c+=go(a[rnd(0,n-1)]);return{c:Math.round(c/T*10)/10};
  }
  function drawChart(){
    const mode=q('ad-bo-mode').value,rows=sizes.map(n=>Object.assign({n},measure(mode,n)));
    const W=620,H=290,L=58,R=16,T=14,B=36,nmax=rows[rows.length-1].n,ymax=Math.max(...rows.map(r=>r.c),1)*1.15;
    const x=n=>L+n/nmax*(W-L-R),y=v=>H-B-v/ymax*(H-T-B);
    let svg=`<svg class="bo-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Measured ${cfg.cLabel.toLowerCase()} against the number of items">`;
    for(let t=0;t<=4;t++){const v=ymax*t/4;svg+=`<line class="ax" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${v>=100?Math.round(v):v.toFixed(v<10?1:0)}</text>`}
    rows.forEach(r=>svg+=`<text x="${x(r.n)}" y="${H-B+16}" text-anchor="middle">${r.n}</text>`);
    svg+=`<text x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">number of items, n</text>`;
    cfg.refs.forEach(k=>{const r=REF[k];let d='';for(let i=1;i<=80;i++){const n=nmax*i/80;d+=(i>1?'L':'M')+x(n).toFixed(1)+' '+y(r.f(n)).toFixed(1)}svg+=`<path class="r" d="${d}" stroke="${r.col}"/>`});
    svg+=`<path class="m" d="${rows.map((r,i)=>(i?'L':'M')+x(r.n)+' '+y(r.c)).join('')}"/>`+rows.map(r=>`<circle cx="${x(r.n)}" cy="${y(r.c)}" r="4"/>`).join('')+'</svg>';
    q('ad-bo-chart').innerHTML=svg;
    q('ad-bo-legend').innerHTML=`<span><i></i>Measured ${cfg.cLabel.toLowerCase()}</span>`+cfg.refs.map(k=>`<span><i class="d" style="border-color:${REF[k].col}"></i>${REF[k].name}</span>`).join('');
    q('ad-bo-tbl').innerHTML=`<table class="t"><tr><th>n</th><th>${cfg.cLabel}</th>${cfg.wLabel&&!isS?`<th>${cfg.wLabel}</th>`:''}</tr>`+rows.map(r=>`<tr><td class="mono">${r.n}</td><td class="mono">${r.c}</td>${cfg.wLabel&&!isS?`<td class="mono">${r.w}</td>`:''}</tr>`).join('')+'</table>';
    const a=rows[rows.length-2],b=rows[rows.length-1];
    q('ad-bo-note').innerHTML=`Doubling n from <b>${a.n}</b> to <b>${b.n}</b> multiplied the work by <b>${(b.c/Math.max(a.c,.0001)).toFixed(2)}</b>. A factor near 1 suggests constant or logarithmic time, near 2 suggests linear (or n log n, which is slightly above 2), and near 4 suggests n².`;
  }
  q('ad-bo-mode').onchange=drawChart;

  if(cfg.needsSorted)q('ad-data').value='sortedS';

  /* ---------- remembered settings ---------- */
  /* Speed is shared by every demo; list type, size and code language are remembered per page. Custom lists are not remembered. */
  const store=typeof settings==='undefined'?{get(){},set(){}}:settings;
  const SK='algo:'+location.pathname+':';
  const sp=store.get('algoSpeed');if(sp)q('ad-speed').value=sp;
  q('ad-speed').addEventListener('input',()=>store.set('algoSpeed',q('ad-speed').value));
  const lt=store.get(SK+'list');if(lt&&lt!=='custom'&&[...q('ad-data').options].some(o=>o.value===lt))q('ad-data').value=lt;
  const sn=+store.get(SK+'n');if(sn>=+q('ad-n').min&&sn<=+q('ad-n').max)q('ad-n').value=sn;
  q('ad-data').addEventListener('change',()=>store.set(SK+'list',q('ad-data').value));
  q('ad-n').addEventListener('change',()=>store.set(SK+'n',q('ad-n').value));
  const ct=[...q('ad-codetabs').querySelectorAll('[role=tab]')];
  const lang=store.get('algoLang');const lb=ct.find(b=>b.dataset.p===lang);if(lb)lb.click();
  ct.forEach(b=>b.addEventListener('click',()=>store.set('algoLang',b.dataset.p)));

  fresh();drawChart();

  /* ---------- shareable links: #block?d=8,3,5&t=5&s=12 (data, search target, step) ---------- */
  const blockId=q('ad-setup').closest('.block').id;
  function shareURL(){
    let h='#'+blockId+'?d='+data.join(',')+(isS?'&t='+target:'')+'&s='+idx;
    return location.origin+location.pathname+location.search+h;
  }
  q('ad-share').onclick=()=>{
    const url=shareURL(),b=q('ad-share');
    try{history.replaceState(null,'',url)}catch(e){}
    const done=ok=>{b.textContent=ok?'Copied!':'Copy the address bar';setTimeout(()=>b.textContent='Copy link',1800)};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(()=>done(true),()=>done(false));else done(false);
  };
  (function fromLink(){
    const h=decodeURIComponent(location.hash.slice(1)),i=h.indexOf('?');
    if(i<0||h.slice(0,i)!==blockId)return;
    const p=new URLSearchParams(h.slice(i+1));
    const nums=(p.get('d')||'').split(',').filter(Boolean).map(Number);
    if(nums.length<2||nums.length>maxN||nums.some(v=>!Number.isInteger(v)||v<1||v>13))return;
    pause();data=nums.slice();
    q('ad-n').value=Math.min(+q('ad-n').max,Math.max(+q('ad-n').min,nums.length));q('ad-nv').textContent=nums.length;
    if(isS){
      const t=parseInt(p.get('t'),10);target=t>=1&&t<=13?t:data[0];q('ad-t').value=target;
      q('ad-data').value=data.every((v,k)=>!k||v>data[k-1])?'sortedS':'random';
    }else{q('ad-data').value='custom';q('ad-cust').classList.remove('hidden');q('ad-ctext').value=nums.join(', ')}
    build();
    const st=parseInt(p.get('s'),10);if(st>0){idx=Math.min(st,steps.length-1);draw()}
  })();
}
