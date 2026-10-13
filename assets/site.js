/* Shared helpers for every demo page. Load this before the page's own <script>. */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
/* tabs: buttons need role=tab and data-p=<panel id> */
function tabs(root){const b=[...root.querySelectorAll('[role=tab]')];b.forEach(x=>x.onclick=()=>b.forEach(y=>{y.setAttribute('aria-selected',y===x);document.getElementById(y.dataset.p).classList.toggle('hidden',y!==x)}))}
/* multiple-choice cards. items: {q,a,why,opts?} */
function cardQuiz(el,items,opts,scoreEl,resetBtn){
  function build(){
    let right=0,done=0;el.innerHTML='';
    const show=()=>{if(scoreEl)scoreEl.textContent=`${right} correct out of ${done} answered (${items.length} questions)`};
    items.forEach(it=>{
      const c=document.createElement('div');c.className='card';
      c.innerHTML=`<div>${it.q}</div><div class="opts"></div><p class="fb hidden"></p>`;
      const o=c.querySelector('.opts'),fb=c.querySelector('.fb');
      (it.opts||opts).forEach(op=>{const b=document.createElement('button');b.textContent=op;b.onclick=()=>{
        if(c.dataset.done)return;c.dataset.done=1;done++;b.classList.add('picked');
        const ok=op===it.a;if(ok)right++;c.classList.add(ok?'right':'wrong');
        fb.innerHTML=(ok?'<b>Correct.</b> ':`<b>Answer: ${it.a}.</b> `)+it.why;fb.classList.remove('hidden');show()};o.appendChild(b)});
      el.appendChild(c)});
    show();
  }
  build();if(resetBtn)resetBtn.onclick=build;
}
/* binary helpers: toBin(173) gives "10101101", nibbles("10101101") gives "1010 1101" */
const toBin=(n,w=8)=>(n>>>0).toString(2).padStart(w,'0').slice(-w), nibbles=s=>s.replace(/(?=(?:.{4})+$)(?!^)/g,' ');
/* a row of clickable bits with a label above each. Returns {get,set}; the value is the bits read as an unsigned number */
function bitRow(el,labels,onchange,value=0){
  const n=labels.length;let v=value;
  el.classList.add('bitrow');el.style.setProperty('--n',n);
  const draw=()=>{el.innerHTML=labels.map((l,i)=>{const b=v>>(n-1-i)&1;return`<div><small>${l}</small><button class="bit" aria-pressed="${!!b}" data-i="${i}">${b}</button></div>`}).join('')};
  el.onclick=e=>{const b=e.target.closest('.bit');if(!b)return;const i=b.dataset.i;v^=1<<(n-1-i);draw();el.querySelector(`[data-i="${i}"]`).focus();if(onchange)onchange(v)};
  draw();
  return{get:()=>v,set:x=>{v=x;draw()}};
}
/* typed-answer practice. gen() returns {q,a,why?}; a is the answer, or a list of accepted answers. Spaces and case are ignored */
function drill(el,gen){
  let cur,right=0,done=0;const norm=s=>String(s).replace(/[\s,]+/g,'').toLowerCase();
  el.classList.add('drill');
  el.innerHTML='<p class="dq"></p><div class="row"><input type="text" autocomplete="off" aria-label="Your answer"><button class="btn pri">Check</button><button class="btn">New question</button><span class="score"></span></div><p class="status"></p>';
  const [q,inp,chk,nxt,sc,fb]=['.dq','input','.pri','.btn:not(.pri)','.score','.status'].map(s=>el.querySelector(s));
  const next=()=>{cur=gen();q.innerHTML=cur.q;inp.value='';inp.disabled=chk.disabled=false;fb.innerHTML=''};
  const check=()=>{if(chk.disabled||!inp.value.trim())return;const acc=[].concat(cur.a),ok=acc.map(norm).includes(norm(inp.value));done++;if(ok)right++;
    fb.innerHTML=(ok?'<b class="okc">Correct.</b> ':`<b class="badc">Answer: ${acc[0]}.</b> `)+(cur.why||'');sc.textContent=`${right} correct out of ${done}`;inp.disabled=chk.disabled=true;nxt.focus()};
  chk.onclick=check;nxt.onclick=()=>{next();inp.focus()};inp.onkeydown=e=>{if(e.key==='Enter')check()};next();
  return{next};
}
/* a pseudocode listing inside <pre class="pc">: one <span data-i> per line */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function listing(el,lines){el.innerHTML=lines.map((l,i)=>`<span data-i="${i}">${esc(l)||' '}</span>`).join('')}
/* a flowchart. nodes: {id,t,x,y,s} centred on x,y, where t is term, io, dec or proc and s is the text with | for a line break.
   arrows: {d,l,x,y} where d is an SVG path and l an optional label placed at x,y */
function flow(el,w,h,nodes,arrows){
  const a=85,b=22,m='ah-'+el.id;
  const shape=({t,x,y})=>t==='term'?`<rect class="fb" x="${x-a}" y="${y-b}" width="${2*a}" height="${2*b}" rx="${b}"/>`
    :t==='io'?`<path class="fb" d="M${x-a+14} ${y-b}H${x+a}L${x+a-14} ${y+b}H${x-a}Z"/>`
    :t==='dec'?`<path class="fb" d="M${x} ${y-b-10}L${x+a+10} ${y}L${x} ${y+b+10}L${x-a-10} ${y}Z"/>`
    :`<rect class="fb" x="${x-a}" y="${y-b}" width="${2*a}" height="${2*b}"/>`;
  const text=n=>{const L=n.s.split('|');return L.map((s,i)=>`<text x="${n.x}" y="${n.y+5+(i-(L.length-1)/2)*16}">${esc(s)}</text>`).join('')};
  el.innerHTML=`<svg class="flow" viewBox="0 0 ${w} ${h}" style="max-width:${w}px" role="img" aria-label="${el.dataset.label||'Flowchart'}"><defs><marker id="${m}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="fh" d="M0 0L10 5L0 10z"/></marker></defs>`
    +arrows.map(r=>`<path class="fa" d="${r.d}" marker-end="url(#${m})"/>`+(r.l?`<text class="fl" x="${r.x}" y="${r.y}">${r.l}</text>`:'')).join('')
    +nodes.map(n=>`<g data-n="${n.id||''}">${shape(n)}${text(n)}</g>`).join('')+'</svg>';
}
