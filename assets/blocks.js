/* Block programming in the style of MakeCode Arcade, for pages with blocks: true. Load after site.js.
   BK.editor(el,opts)   a block editor with a palette, or (readOnly) a picture of a program
   BK.arcade(el,opts)   a small games console that runs a program
   BK.lab(el,opts)      an editor and a console side by side, with Run, Stop and a JavaScript view
   BK.sim(prog)         a console with no screen, for checking a program: step frames, hold buttons, read sprites
   A program is a list of scripts. A script or block is {t:type, f:{field:value}, b:[blocks inside]},
   or the short form [type, {fields}, [blocks inside]]. The types are listed in DEF below. */
const BK=(()=>{
const CAT={loops:['Loops','#20BF6B'],logic:['Logic','#5B80A5'],sprites:['Sprites','#4B7BEC'],controller:['Controller','#D54322'],game:['Game','#8854D0'],info:['Info','#CF6A87'],scene:['Scene','#4B6584'],functions:['Functions','#3455DB']};
const IMG={duck:'🦆',ghost:'👻',strawberry:'🍓',gem:'💎',cake:'🍰',apple:'🍎',rocket:'🚀',alien:'👾',bat:'🦇',star:'⭐',cat:'🐱',dog:'🐶',fish:'🐟',shark:'🦈',bee:'🐝',car:'🚗',fire:'🔥',ball:'⚽'};
const COL={black:'#000000',blue:'#003FAD','light blue':'#87F2FF',teal:'#249CA3',green:'#78DC52',purple:'#8E2EC4',pink:'#FF93C4',tan:'#E5CDC4'};
const COLN={black:15,blue:8,'light blue':9,teal:6,green:7,purple:10,pink:3,tan:13};
const KCOL={Player:'#4B7BEC',Enemy:'#E03131',Food:'#20BF6B',Projectile:'#FFB000'};
const OPT={sprite:['mySprite','enemy','food','sprite','otherSprite'],kind:['Player','Enemy','Food','Projectile'],btn:['A','B','left','right','up','down'],img:Object.keys(IMG),xy:['x','y'],op:['<','>'],wl:['win','lose'],colour:Object.keys(COL)};
/* c: category, k: hat (an event with blocks inside), c (a block with blocks inside) or nothing (a plain block),
   t: the words on the block with {field:type}, d: default field values, js: the MakeCode JavaScript, as [open, close] for blocks with insides.
   x: true for blocks that are only ever shown, never run or offered in a palette */
const DEF={
 start:{c:'loops',k:'hat',t:'on start',js:()=>['','']},
 forever:{c:'loops',k:'hat',t:'forever',js:()=>['forever(function () {','})']},
 every:{c:'game',k:'hat',t:'on game update every {ms:num} ms',d:{ms:1000},js:f=>[`game.onUpdateInterval(${f.ms}, function () {`,'})']},
 press:{c:'controller',k:'hat',t:'on {b:btn} button pressed',d:{b:'A'},js:f=>[`controller.${f.b}.onEvent(ControllerButtonEvent.Pressed, function () {`,'})']},
 overlap:{c:'sprites',k:'hat',t:'on sprite of kind {k1:kind} overlaps otherSprite of kind {k2:kind}',d:{k1:'Player',k2:'Food'},js:f=>[`sprites.onOverlap(SpriteKind.${f.k1}, SpriteKind.${f.k2}, function (sprite, otherSprite) {`,'})']},
 func:{c:'functions',k:'hat',t:'function {n:name}',d:{n:'doSomething'},js:f=>[`function ${f.n} () {`,'}']},
 olapS:{c:'sprites',k:'hat',x:true,t:'on {a:sprite} overlaps {b:sprite}',d:{a:'mySprite',b:'food'},js:f=>[`${f.a}.onOverlap(${f.b}, function () {`,'})']},
 create:{c:'sprites',t:'set {v:sprite} to sprite {i:img} of kind {k:kind}',d:{v:'mySprite',i:'duck',k:'Player'},js:f=>`${f.v} = sprites.create(assets.image\`${f.i}\`, SpriteKind.${f.k})`},
 pos:{c:'sprites',t:'set {s:sprite} position to x {x:num} y {y:num}',d:{s:'mySprite',x:80,y:60},js:f=>`${f.s}.setPosition(${f.x}, ${f.y})`},
 rand:{c:'sprites',t:'move {s:sprite} to a random place',d:{s:'food'},js:f=>`${f.s}.setPosition(randint(8, 152), randint(8, 112))`},
 change:{c:'sprites',t:'change {s:sprite} {p:xy} by {n:num}',d:{s:'mySprite',p:'x',n:2},js:f=>`${f.s}.${f.p} += ${f.n}`},
 vel:{c:'sprites',t:'set {s:sprite} velocity to vx {x:num} vy {y:num}',d:{s:'mySprite',x:50,y:0},js:f=>`${f.s}.setVelocity(${f.x}, ${f.y})`},
 follow:{c:'sprites',t:'set {s:sprite} follow {o:sprite} speed {n:num}',d:{s:'enemy',o:'mySprite',n:30},js:f=>`${f.s}.follow(${f.o}, ${f.n})`},
 say:{c:'sprites',t:'{s:sprite} say {m:text}',d:{s:'mySprite',m:'Hello!'},js:f=>`${f.s}.sayText("${f.m}", 2000, false)`},
 bounce:{c:'sprites',t:'set {s:sprite} to bounce on walls',d:{s:'mySprite'},js:f=>`${f.s}.setBounceOnWall(true)`},
 stay:{c:'sprites',t:'set {s:sprite} to stay in screen',d:{s:'mySprite'},js:f=>`${f.s}.setStayInScreen(true)`},
 destroy:{c:'sprites',t:'destroy {s:sprite}',d:{s:'otherSprite'},js:f=>`sprites.destroy(${f.s})`},
 shoot:{c:'sprites',t:'shoot {i:img} from {s:sprite} with vx {x:num} vy {y:num}',d:{i:'fire',s:'mySprite',x:0,y:-80},js:f=>`projectile = sprites.createProjectileFromSprite(assets.image\`${f.i}\`, ${f.s}, ${f.x}, ${f.y})`},
 move:{c:'controller',t:'move {s:sprite} with buttons speed {n:num}',d:{s:'mySprite',n:60},js:f=>`controller.moveSprite(${f.s}, ${f.n}, ${f.n})`},
 ifbtn:{c:'logic',k:'c',t:'if {b:btn} button is pressed then',d:{b:'left'},js:f=>[`if (controller.${f.b}.isPressed()) {`,'}']},
 ifpos:{c:'logic',k:'c',t:'if {s:sprite} {p:xy} {o:op} {n:num} then',d:{s:'mySprite',p:'x',o:'<',n:20},js:f=>[`if (${f.s}.${f.p} ${f.o} ${f.n}) {`,'}']},
 repeat:{c:'loops',k:'c',t:'repeat {n:num} times',d:{n:4},js:f=>[`for (let index = 0; index < ${f.n}; index++) {`,'}']},
 pause:{c:'loops',t:'pause {n:num} ms',d:{n:500},js:f=>`pause(${f.n})`},
 score:{c:'info',t:'change score by {n:num}',d:{n:1},js:f=>`info.changeScoreBy(${f.n})`},
 setscore:{c:'info',t:'set score to {n:num}',d:{n:0},js:f=>`info.setScore(${f.n})`},
 life:{c:'info',t:'change life by {n:num}',d:{n:-1},js:f=>`info.changeLifeBy(${f.n})`},
 setlife:{c:'info',t:'set life to {n:num}',d:{n:3},js:f=>`info.setLife(${f.n})`},
 countdown:{c:'info',t:'start countdown {n:num} s',d:{n:30},js:f=>`info.startCountdown(${f.n})`},
 over:{c:'game',t:'game over {w:wl}',d:{w:'lose'},js:f=>`game.gameOver(${f.w==='win'})`},
 splash:{c:'game',t:'splash {m:text}',d:{m:'Ready?'},js:f=>`game.splash("${f.m}")`},
 bg:{c:'scene',t:'set background colour to {c:colour}',d:{c:'teal'},js:f=>`scene.setBackgroundColor(${COLN[f.c]})`},
 shake:{c:'scene',t:'camera shake',js:()=>`scene.cameraShake(4, 500)`},
 call:{c:'functions',t:'call {n:fn}',d:{n:'doSomething'},js:f=>`${f.n}()`},
};
const isBox=t=>!!DEF[t]&&(DEF[t].k==='hat'||DEF[t].k==='c');
/* fill in defaults and expand the short form */
function norm(n){
  if(Array.isArray(n)&&typeof n[0]!=='string')return n.map(norm);
  if(Array.isArray(n)){const [t,a,b]=n;n=Array.isArray(a)?{t,b:a}:{t,f:a,b}}
  const D=DEF[n.t];if(!D)throw new Error('Unknown block '+n.t);
  const o={t:n.t,f:{...(D.d||{}),...(n.f||{})}};
  if(isBox(n.t))o.b=(n.b||[]).map(norm);
  if(n.off)o.off=true;if(n.hl)o.hl=n.hl;if(n.id)o.id=n.id;
  return o;
}
const prog=p=>p.map(s=>s.t==='_loose'?{t:'_loose',b:s.b.map(norm)}:norm(s));
const clone=p=>JSON.parse(JSON.stringify(p));
function walk(arr,fn,d=0){arr.forEach(n=>{if(n.t!=='_loose')fn(n,d);if(n.b)walk(n.b,fn,n.t==='_loose'?d:d+1)})}
const count=arr=>{let k=0;walk(arr,()=>k++);return k};
const label=n=>DEF[n.t].t.replace(/\{(\w+):\w+\}/g,(m,k)=>n.f[k]);
const funcs=p=>p.filter(s=>s.t==='func').map(s=>s.f.n);

/* ---------- JavaScript ---------- */
function toJS(p){
  const ev=[],vars=new Set();let start='';
  const list=(arr,d)=>arr.map(n=>line(n,d)).join('');
  function line(n,d){
    const pad='    '.repeat(d),j=DEF[n.t].js(n.f);
    if(n.t==='create')vars.add(n.f.v);if(n.t==='shoot')vars.add('projectile');
    return Array.isArray(j)?`${pad}${j[0]}\n${list(n.b,d+1)}${pad}${j[1]}\n`:`${pad}${j}\n`;
  }
  p.forEach(s=>{if(s.t==='_loose'||s.off)return;if(s.t==='start')start+=list(s.b,0);else ev.push(line(s,0))});
  vars.delete('sprite');vars.delete('otherSprite');
  return (ev.join('\n')+(ev.length?'\n':'')+[...vars].map(v=>`let ${v}: Sprite = null\n`).join('')+start).trimEnd().split('\n');
}

/* ---------- editor ---------- */
function editor(el,o={}){
  const ro=!!o.readOnly;let P=prog(o.program||[]),palette=o.palette||[];
  el.classList.add('bk-ed');el.classList.toggle('ro',ro);el.classList.toggle('pick',!!o.onPick);
  if(o.height)el.style.setProperty('--h',o.height+'px');
  el.innerHTML=(ro?'':'<div class="bk-pal" aria-label="Blocks to drag into your program"></div>')+'<div class="bk-ws"></div>';
  const pal=el.querySelector('.bk-pal'),ws=el.querySelector('.bk-ws'),nodeOf=new WeakMap(),listOf=new WeakMap();
  const changed=()=>{if(o.onChange)o.onChange(P)};
  function field(n,k,type,live){
    const v=n.f[k];
    if(!live){const s=document.createElement('span');s.className='bk-v'+(type==='num'||type==='text'||type==='name'?' bk-lit':'');s.textContent=type==='img'?`${IMG[v]||''} ${v}`:v;return s}
    if(type==='num'||type==='text'||type==='name'){
      const i=document.createElement('input');i.type='text';i.value=v;i.setAttribute('aria-label',k);if(type==='num')i.inputMode='decimal';
      const fit=()=>i.style.setProperty('--w',Math.max(2,String(i.value).length));fit();
      i.oninput=()=>{if(type==='name')i.value=i.value.replace(/[^A-Za-z0-9_]/g,'');n.f[k]=type==='num'&&i.value.trim()!==''&&!isNaN(i.value)?+i.value:i.value;fit();changed()};
      if(type==='name')i.onchange=render;
      return i;
    }
    const s=document.createElement('select'),opts=type==='fn'?[...new Set([...funcs(P),v])]:OPT[type];
    s.setAttribute('aria-label',k);
    s.innerHTML=opts.map(x=>`<option value="${esc(x)}"${x===v?' selected':''}>${type==='img'?IMG[x]+' ':''}${esc(x)}</option>`).join('');
    s.onchange=()=>{n.f[k]=s.value;changed()};
    return s;
  }
  function blk(n,live){
    const D=DEF[n.t],e=document.createElement('div'),h=document.createElement('div');
    e.className='bk bk-'+(D.k||'s')+(n.hl?' bk-hl'+(n.hl===2?' bk-bad':''):'')+(n.off?' bk-off':'');e.style.setProperty('--c',CAT[D.c][1]);
    h.className='bk-h';
    D.t.split(/(\{\w+:\w+\})/).forEach(p=>{const m=p.match(/^\{(\w+):(\w+)\}$/);
      if(m)h.append(field(n,m[1],m[2],live));else if(p.trim()){const s=document.createElement('span');s.textContent=p.trim();h.append(s)}});
    if(live&&D.k==='hat'&&o.toggles){const t=document.createElement('button');t.type='button';t.className='bk-tog';t.setAttribute('aria-pressed',!n.off);
      t.title=n.off?'Switched off. Click to switch it back on.':'Click to switch this part off';t.textContent=n.off?'off':'on';t.onclick=()=>{n.off=!n.off;render();changed()};h.append(t)}
    e.append(h);
    if(n.b){e.append(stack(n.b,live));const f=document.createElement('div');f.className='bk-ft';e.append(f)}
    nodeOf.set(e,n);return e;
  }
  function stack(arr,live){const d=document.createElement('div');d.className='bk-stk';listOf.set(d,arr);arr.forEach(n=>d.append(blk(n,live)));return d}
  function render(){
    ws.innerHTML='';listOf.set(ws,P);
    P.forEach(s=>{if(s.t!=='_loose')return ws.append(blk(s,!ro));
      const w=document.createElement('div');w.className='bk-loose';w.title='These blocks are not inside an event such as "on start", so they will not run.';w.append(stack(s.b,!ro));nodeOf.set(w,s);ws.append(w)});
    ws.classList.toggle('empty',!P.length);
  }
  function renderPal(){
    if(ro)return;pal.innerHTML='';let last=null;
    const ns=palette.map(x=>norm(typeof x==='string'?{t:x}:x)),cats=[...new Set(ns.map(n=>DEF[n.t].c))];
    ns.sort((a,b)=>cats.indexOf(DEF[a.t].c)-cats.indexOf(DEF[b.t].c)).forEach(n=>{const c=DEF[n.t].c;
      if(c!==last){last=c;const h=document.createElement('div');h.className='bk-cat';h.style.setProperty('--c',CAT[c][1]);h.textContent=CAT[c][0];pal.append(h)}
      const e=blk(n,false);e.dataset.proto=JSON.stringify(n);pal.append(e)});
  }
  if(o.onPick)ws.addEventListener('click',e=>{const b=e.target.closest('.bk');if(b&&nodeOf.get(b))o.onPick(nodeOf.get(b),b)});

  /* dragging: a block takes every block below it in the same stack with it, as in MakeCode */
  let pend=null,drag=null;const ins=document.createElement('div');ins.className='bk-ins';ins.hidden=true;
  const inside=(r,e)=>e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
  el.addEventListener('pointerdown',e=>{
    if(ro||e.button>0||e.target.closest('input,select,button'))return;
    let b=e.target.closest('.bk');if(!b)return;
    const fromPal=pal.contains(b);if(fromPal)b=b.closest('.bk-pal>.bk');
    pend={x:e.clientX,y:e.clientY,el:b,fromPal};
  });
  function begin(){
    const r=pend.el.getBoundingClientRect();let nodes,from=null;
    if(pend.fromPal)nodes=[norm(JSON.parse(pend.el.dataset.proto))];
    else{const n=nodeOf.get(pend.el),arr=listOf.get(pend.el.parentElement),i=arr.indexOf(n);
      nodes=DEF[n.t].k==='hat'?arr.splice(i,1):arr.splice(i);from={arr,i};render()}
    const g=document.createElement('div');g.className='bk-ghost';nodes.forEach(n=>g.append(blk(n,false)));document.body.append(g,ins);
    drag={nodes,from,g,dx:pend.x-r.left,dy:pend.y-r.top,hat:DEF[nodes[0].t].k==='hat'};
    pal.classList.add('drop');
  }
  function target(e){
    if(inside(pal.getBoundingClientRect(),e))return{del:true};
    if(!inside(ws.getBoundingClientRect(),e))return null;
    const x=e.clientX-drag.dx,y=e.clientY-drag.dy;
    if(drag.hat){let best={top:P.length},bd=Infinity;[...ws.children].forEach((c,i)=>{const r=c.getBoundingClientRect(),d=Math.hypot(r.left-x,r.top-y);
      if(d<bd){bd=d;const after=x>r.left+r.width/2||y>r.bottom;best={top:after?i+1:i,x:after?r.right+6:r.left-8,y:r.top,v:1}}});return best}
    let best=null,bd=46;
    ws.querySelectorAll('.bk-stk').forEach(s=>{const arr=listOf.get(s),kids=[...s.children],r=s.getBoundingClientRect();
      for(let i=0;i<=kids.length;i++){const yy=i<kids.length?kids[i].getBoundingClientRect().top:kids.length?kids[i-1].getBoundingClientRect().bottom:r.top+4,d=Math.hypot((x-r.left)*.6,y-yy);
        if(d<bd){bd=d;best={arr,i,x:r.left,y:yy}}}});
    return best||{loose:true};
  }
  window.addEventListener('pointermove',e=>{
    if(pend&&!drag&&Math.hypot(e.clientX-pend.x,e.clientY-pend.y)>5)begin();
    if(!drag)return;e.preventDefault();
    drag.g.style.left=e.clientX-drag.dx+'px';drag.g.style.top=e.clientY-drag.dy+'px';
    const t=target(e);pal.classList.toggle('del',!!(t&&t.del));
    ins.hidden=!(t&&t.y!==undefined);if(!ins.hidden){ins.classList.toggle('v',!!t.v);ins.style.left=t.x+'px';ins.style.top=t.y-2+'px'}
  },{passive:false});
  function drop(e){
    const t=e&&target(e),{nodes,from}=drag;
    drag.g.remove();ins.hidden=true;pal.classList.remove('drop','del');drag=pend=null;
    if(t&&t.del){}
    else if(!t){if(from)from.arr.splice(from.i,0,...nodes)}
    else if(t.top!==undefined)P.splice(t.top,0,...nodes);
    else if(t.loose)P.push({t:'_loose',b:nodes});
    else t.arr.splice(t.i,0,...nodes);
    for(let k=P.length-1;k>=0;k--)if(P[k].t==='_loose'&&!P[k].b.length)P.splice(k,1);
    render();changed();
  }
  window.addEventListener('pointerup',e=>{
    if(drag)return drop(e);
    if(pend&&pend.fromPal){/* a click on the palette adds the block to the end of the last script */
      const n=norm(JSON.parse(pend.el.dataset.proto)),last=P[P.length-1];
      if(DEF[n.t].k==='hat'||!last)P.push(DEF[n.t].k==='hat'?n:{t:'_loose',b:[n]});else last.b.push(n);
      render();changed();
    }
    pend=null;
  });
  window.addEventListener('pointercancel',()=>{if(drag)drop(null);pend=null});
  renderPal();render();
  return{get prog(){return P},set(p){P=prog(p);render()},setPalette(p){palette=p;renderPal()},render,el};
}

/* ---------- the console ---------- */
const PIC={};
function pic(k){
  if(PIC[k])return PIC[k];
  const p=document.createElement('canvas');p.width=p.height=16;const x=p.getContext('2d');
  x.font='13px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(IMG[k]||'?',8,9);
  return PIC[k]=p;
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),DT=1000/30;
const KEY={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down',' ':'A',z:'A',Enter:'A',x:'B'};
function arcade(host,o={}){
  if(host){
    host.classList.add('ac');host.tabIndex=0;host.setAttribute('aria-label','Game screen. Click it, then use the arrow keys. Space is the A button.');
    host.innerHTML='<canvas width="320" height="240"></canvas>'+(o.pad===false?'':'<div class="ac-pad"><div class="ac-dpad"><button type="button" tabindex="-1" data-b="up" aria-label="Up">▲</button><button type="button" tabindex="-1" data-b="left" aria-label="Left">◀</button><button type="button" tabindex="-1" data-b="right" aria-label="Right">▶</button><button type="button" tabindex="-1" data-b="down" aria-label="Down">▼</button></div><p class="ac-hint">Click the screen, then use the arrow keys. Space is A.</p><div class="ac-ab"><button type="button" tabindex="-1" data-b="B">B</button><button type="button" tabindex="-1" data-b="A">A</button></div></div>');
  }
  const cv=host&&host.querySelector('canvas'),c=cv&&cv.getContext('2d');
  let P=[],S=[],vars={},threads=[],btn={},queue=[],timers=[],olap=new Set(),score=null,life=null,count=null,bg=COL.black,splash=null,state='ready',won=false,warned=new Set(),raf=0,last=0,acc=0,ops=0,shake=0,nid=0,frames=0;
  const api={view:'images',load(p){P=clone(p)},run,stop,step,hold,draw,
    get sprites(){return S},get vars(){return vars},get state(){return state},get score(){return score},get life(){return life},get countdown(){return count},get frames(){return frames},
    focus(){if(host)host.focus({preventScroll:true})},idle:o.idle||'Press ▶ Run'};
  const warn=m=>{if(warned.has(m))return;warned.add(m);if(o.onWarn)o.onWarn(m)};
  const mk=(i,k)=>{const s={id:++nid,img:i,kind:k,x:80,y:60,vx:0,vy:0,ctl:0,fol:null,bounce:false,stay:false,say:'',sayT:0,dead:false,auto:false};S.push(s);return s};
  function get(name,ctx,n){
    const local=name==='sprite'||name==='otherSprite',s=local?ctx[name]:vars[name];
    if(!s){warn(local?`"${name}" only exists inside an overlap event, so "${label(n)}" did nothing.`:`"${name}" has not been set to a sprite yet, so "${label(n)}" did nothing.`);return null}
    return s.dead?null:s;
  }
  function* exec(arr,ctx){for(const n of arr){if(state!=='run')return;yield* op(n,ctx)}}
  function* op(n,ctx){
    const f=n.f,num=v=>+v||0;let s;
    if(++ops>5000){ops=0;warn('A loop ran thousands of times in a single frame. Add a pause, or use fewer repeats.');yield 0}
    switch(n.t){
      case 'create':s=mk(f.i,f.k);if(f.v==='sprite'||f.v==='otherSprite')ctx[f.v]=s;else vars[f.v]=s;break;
      case 'pos':if(s=get(f.s,ctx,n)){s.x=num(f.x);s.y=num(f.y)}break;
      case 'rand':if(s=get(f.s,ctx,n)){s.x=8+Math.random()*144;s.y=16+Math.random()*96}break;
      case 'change':if(s=get(f.s,ctx,n))s[f.p]+=num(f.n);break;
      case 'vel':if(s=get(f.s,ctx,n)){s.vx=num(f.x);s.vy=num(f.y);s.fol=null}break;
      case 'follow':{const t=get(f.o,ctx,n);if((s=get(f.s,ctx,n))&&t)s.fol={t,sp:num(f.n)};break}
      case 'say':if(s=get(f.s,ctx,n)){s.say=String(f.m);s.sayT=2000}break;
      case 'bounce':if(s=get(f.s,ctx,n))s.bounce=true;break;
      case 'stay':if(s=get(f.s,ctx,n))s.stay=true;break;
      case 'destroy':if(s=get(f.s,ctx,n))s.dead=true;break;
      case 'shoot':if(s=get(f.s,ctx,n)){const p=mk(f.i,'Projectile');p.x=s.x;p.y=s.y;p.vx=num(f.x);p.vy=num(f.y);p.auto=true;vars.projectile=p}break;
      case 'move':if(s=get(f.s,ctx,n)){s.ctl=num(f.n);s.fol=null}break;
      case 'ifbtn':if(btn[f.b])yield* exec(n.b,ctx);break;
      case 'ifpos':if(s=get(f.s,ctx,n)){const v=s[f.p];if(f.o==='<'?v<num(f.n):v>num(f.n))yield* exec(n.b,ctx)}break;
      case 'repeat':for(let i=0;i<num(f.n);i++)yield* exec(n.b,ctx);break;
      case 'pause':yield Math.max(0,num(f.n));break;
      case 'score':score=(score||0)+num(f.n);break;
      case 'setscore':score=num(f.n);break;
      case 'life':life=(life===null?3:life)+num(f.n);break;
      case 'setlife':life=num(f.n);break;
      case 'countdown':count=num(f.n);break;
      case 'over':end(f.w==='win');break;
      case 'splash':splash={m:String(f.m),t:1500};yield 0;break;
      case 'bg':bg=COL[f.c]||bg;break;
      case 'shake':shake=500;break;
      case 'call':{const h=P.find(x=>x.t==='func'&&x.f.n===f.n);
        if(!h)warn(`There is no function called "${f.n}".`);
        else if(h.off)warn(`The function "${f.n}" is switched off, so calling it did nothing.`);
        else if((ctx.depth||0)>40)warn(`"${f.n}" keeps calling itself, so it was stopped.`);
        else yield* exec(h.b,{...ctx,depth:(ctx.depth||0)+1});break}
    }
  }
  function go(h,ctx){threads.push({g:exec(h.b,ctx),w:0})}
  function end(win){if(state!=='run')return;state='over';won=win;threads=[];if(o.onState)o.onState('over',{win,score})}
  function reset(){
    S=[];vars={};threads=[];queue=[];olap=new Set();score=life=count=splash=null;bg=COL.black;warned=new Set();shake=0;frames=0;
    timers=P.filter(h=>h.t==='every'&&!h.off).map(h=>({h,acc:0}));
  }
  function run(live=true){
    reset();state='run';
    P.filter(h=>h.t==='start'&&!h.off).forEach(h=>go(h,{}));
    P.filter(h=>h.t==='forever'&&!h.off).forEach(h=>threads.push({g:(function*(){for(;;){yield* exec(h.b,{});yield 0}})(),w:0}));
    if(o.onState)o.onState('run');
    if(live&&c&&!raf){last=0;acc=0;raf=requestAnimationFrame(loop)}
  }
  function stop(){state='ready';api.idle='Stopped. Press ▶ Run';cancelAnimationFrame(raf);raf=0;threads=[];if(o.onState)o.onState('ready');draw()}
  function loop(t){
    if(!last)last=t;acc+=Math.min(200,t-last);last=t;
    while(acc>=DT&&state==='run'){acc-=DT;step()}
    draw();raf=state==='run'?requestAnimationFrame(loop):0;
  }
  function hold(b,on){if(on&&!btn[b]&&state==='run')queue.push(b);btn[b]=on}
  function step(n=1){for(let k=0;k<n&&state==='run';k++)tick()}
  function tick(){
    if(splash){splash.t-=DT;if(splash.t<=0)splash=null;return}
    frames++;
    while(queue.length){const b=queue.shift();P.forEach(h=>{if(h.t==='press'&&!h.off&&h.f.b===b)go(h,{})})}
    timers.forEach(tm=>{tm.acc+=DT;const ms=Math.max(50,+tm.h.f.ms||0);while(tm.acc>=ms){tm.acc-=ms;go(tm.h,{})}});
    for(const th of threads.slice()){
      if(state!=='run'||splash)break;
      if(th.w>0){th.w-=DT;if(th.w>0)continue}
      ops=0;let r;try{r=th.g.next()}catch(err){r={done:true};warn('Something went wrong: '+err.message)}
      if(r.done)threads.splice(threads.indexOf(th),1);else th.w=r.value||0;
    }
    if(state!=='run')return;
    const dt=DT/1000;
    for(const s of S){
      if(s.ctl){s.vx=((btn.right?1:0)-(btn.left?1:0))*s.ctl;s.vy=((btn.down?1:0)-(btn.up?1:0))*s.ctl}
      if(s.fol){const t=s.fol.t;if(t.dead){s.fol=null;s.vx=s.vy=0}else{const dx=t.x-s.x,dy=t.y-s.y,d=Math.hypot(dx,dy);
        if(d<2)s.vx=s.vy=0;else{s.vx=dx/d*s.fol.sp;s.vy=dy/d*s.fol.sp}}}
      s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(s.bounce){if(s.x<8||s.x>152){s.x=clamp(s.x,8,152);s.vx=-s.vx}if(s.y<8||s.y>112){s.y=clamp(s.y,8,112);s.vy=-s.vy}}
      if(s.stay){s.x=clamp(s.x,8,152);s.y=clamp(s.y,8,112)}
      if(s.auto&&(s.x<-16||s.x>176||s.y<-16||s.y>136))s.dead=true;
      if(s.sayT>0)s.sayT-=DT;
    }
    S=S.filter(s=>!s.dead);
    const now=new Set();
    P.forEach((h,hi)=>{if(h.t!=='overlap'||h.off)return;
      for(const a of S)if(a.kind===h.f.k1)for(const b of S)if(b!==a&&b.kind===h.f.k2&&Math.abs(a.x-b.x)<13&&Math.abs(a.y-b.y)<13){
        const k=hi+':'+a.id+':'+b.id;now.add(k);if(!olap.has(k))go(h,{sprite:a,otherSprite:b})}});
    olap=now;
    if(count!==null){count-=DT/1000;if(count<=0){count=0;end(false)}}
    if(life!==null&&life<=0)end(false);
    if(shake>0)shake-=DT;
  }
  function box(x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.fill()}
  function draw(){
    if(!c)return;
    c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=false;c.textBaseline='middle';
    c.fillStyle=bg;c.fillRect(0,0,160,120);
    c.save();if(shake>0)c.translate(Math.random()*4-2,Math.random()*4-2);
    for(const s of S){
      const x=Math.round(s.x-8),y=Math.round(s.y-8);
      if(api.view!=='boxes')c.drawImage(pic(s.img),x,y,16,16);
      if(api.view!=='images'){c.strokeStyle=KCOL[s.kind];c.lineWidth=1;c.strokeRect(x+.5,y+.5,15,15);
        if(api.view==='boxes'){c.globalAlpha=.35;c.fillStyle=KCOL[s.kind];c.fillRect(x,y,16,16);c.globalAlpha=1;c.fillStyle='#fff';c.font='bold 8px Manrope,sans-serif';c.textAlign='center';c.fillText(s.kind[0],s.x,s.y+.5)}}
    }
    c.font='bold 7px Manrope,sans-serif';c.textAlign='left';
    for(const s of S)if(s.sayT>0&&s.say){const w=c.measureText(s.say).width+6,bx=clamp(s.x-w/2,1,159-w);let by=s.y-21;if(by<1)by=s.y+9;
      box(bx,by,w,11,3,'#fff');c.fillStyle='#000';c.fillText(s.say,bx+3,by+6)}
    c.restore();
    c.font='bold 8px Manrope,sans-serif';
    if(score!==null){const t=String(score),w=c.measureText(t).width+8;box(158-w,2,w,12,3,'rgba(0,0,0,.6)');c.fillStyle='#fff';c.textAlign='right';c.fillText(t,154,8.5)}
    if(life!==null){c.textAlign='left';box(2,2,30,12,3,'rgba(0,0,0,.6)');c.fillStyle='#FF5A5A';c.fillText('♥',6,8.5);c.fillStyle='#fff';c.fillText('x'+Math.max(0,life),14,8.5)}
    if(count!==null){const s=Math.ceil(count),t=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;c.textAlign='center';box(64,2,32,12,3,'rgba(0,0,0,.6)');c.fillStyle='#fff';c.fillText(t,80,8.5)}
    c.textAlign='center';
    if(splash){box(14,44,132,32,5,'#fff');c.fillStyle='#000';c.font='bold 9px Manrope,sans-serif';c.fillText(splash.m,80,60.5)}
    if(state!=='run'){
      c.fillStyle='rgba(0,0,0,.6)';c.fillRect(0,0,160,120);c.fillStyle='#fff';
      if(state==='over'){c.font='800 15px Manrope,sans-serif';c.fillText(won?'YOU WIN!':'GAME OVER',80,score===null?60:54);
        if(score!==null){c.font='bold 9px Manrope,sans-serif';c.fillText('Score: '+score,80,70)}}
      else{c.font='bold 10px Manrope,sans-serif';c.fillText(api.idle,80,60)}
    }
  }
  if(host){
    host.addEventListener('keydown',e=>{const b=KEY[e.key.length===1?e.key.toLowerCase():e.key];if(!b||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(!e.repeat)hold(b,true)});
    host.addEventListener('keyup',e=>{const b=KEY[e.key.length===1?e.key.toLowerCase():e.key];if(b)hold(b,false)});
    host.addEventListener('blur',()=>{btn={}});
    cv.addEventListener('pointerdown',()=>api.focus());
    host.querySelectorAll('[data-b]').forEach(b=>{
      b.addEventListener('pointerdown',e=>{e.preventDefault();api.focus();hold(b.dataset.b,true)});
      ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>hold(b.dataset.b,false)));
    });
    draw();
  }
  return api;
}
const sim=p=>{const a=arcade(null);a.load(prog(p));a.run(false);return a};

/* ---------- editor and console together ---------- */
function lab(el,o={}){
  el.classList.add('bk-lab');
  el.innerHTML=`<div class="bk-main"><div class="bk-top"><div class="seg" role="group" aria-label="View"><button type="button" aria-pressed="true">Blocks</button><button type="button" aria-pressed="false">JavaScript</button></div><span class="bk-n"></span></div><div class="bk-edh"></div><pre class="pc bk-js hidden"></pre></div>
  <div class="bk-side"><div class="bk-gh"></div><div class="row" style="margin-top:10px"><button type="button" class="btn pri">▶ Run</button><button type="button" class="btn">■ Stop</button></div><p class="status bk-msg"></p></div>`;
  const [bB,bJ]=el.querySelectorAll('.seg button'),js=el.querySelector('.bk-js'),edh=el.querySelector('.bk-edh'),msg=el.querySelector('.bk-msg'),[run,stp]=el.querySelectorAll('.bk-side .btn');
  let timer=0;
  const say=h=>{msg.innerHTML=h||''};
  const upd=()=>{listing(js,toJS(ed.prog));el.querySelector('.bk-n').textContent=`${count(ed.prog)} block${count(ed.prog)===1?'':'s'}`};
  const ed=editor(edh,{palette:o.palette,program:o.program,toggles:o.toggles,height:o.height,onChange:p=>{upd();
    if(game.state==='run'){clearTimeout(timer);timer=setTimeout(start,500)}if(o.onChange)o.onChange(p)}});
  const game=arcade(el.querySelector('.bk-gh'),{onWarn:m=>say(`<span class="badc">⚠ ${esc(m)}</span>`),
    onState:(s,d)=>{run.textContent=s==='run'?'↻ Restart':'▶ Run';if(s==='over'&&o.onOver)o.onOver(d)}});
  function start(){say('');game.load(ed.prog);game.run();game.focus()}
  run.onclick=start;stp.onclick=()=>game.stop();
  [bB,bJ].forEach(b=>b.onclick=()=>{const j=b===bJ;bB.setAttribute('aria-pressed',!j);bJ.setAttribute('aria-pressed',j);js.classList.toggle('hidden',!j);edh.classList.toggle('hidden',j)});
  upd();
  return{ed,game,say,start,get prog(){return ed.prog},set(p){ed.set(p);upd();if(game.state!=='ready')game.stop()},setPalette:p=>ed.setPalette(p)};
}
return{DEF,CAT,IMG,COL,editor,arcade,lab,sim,norm,prog,walk,count,toJS,label,clone};
})();
