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
