/* Boolean expression helpers shared by the logic gates, Boolean simplification and Karnaugh map demos:
   parse an expression, evaluate it, print it in the chosen notation. Load after site.js. */
const SYM={ocr:{and:' ∧ ',or:' ∨ ',xor:' ⊻ ',not:'¬'},alg:{and:'·',or:' + ',xor:' ⊕ ',not:''},words:{and:' AND ',or:' OR ',xor:' XOR ',not:'NOT '}};
let NOTA='ocr';
function parse(src){
  const s=src.toUpperCase().replace(/\bAND\b/g,'&').replace(/\bXOR\b/g,'^').replace(/\bOR\b/g,'|').replace(/\bNOT\b/g,'!');
  const t=[];
  for(const ch of s){
    if(/\s/.test(ch))continue;
    if('&·.∧*'.includes(ch))t.push('&');else if('|+∨'.includes(ch))t.push('|');
    else if('^⊕⊻'.includes(ch))t.push('^');else if('!¬~'.includes(ch))t.push('!');
    else if("'’".includes(ch))t.push("'");else if('()01ABCD'.includes(ch))t.push(ch);
    else throw new Error(`Unexpected character “${ch}”. Use A–D, 0, 1, brackets and operators.`);
  }
  if(!t.length)throw new Error('Type an expression first.');
  let i=0;const pk=()=>t[i];
  const orE=()=>{let n=xorE();while(pk()==='|'){i++;n={t:'or',a:n,b:xorE()}}return n};
  const xorE=()=>{let n=andE();while(pk()==='^'){i++;n={t:'xor',a:n,b:andE()}}return n};
  const andE=()=>{let n=un();while(pk()==='&'||(pk()&&'!(01ABCD'.includes(pk()))){if(pk()==='&')i++;n={t:'and',a:n,b:un()}}return n};
  const un=()=>{if(pk()==='!'){i++;return{t:'not',a:un()}}let n=atom();while(pk()==="'"){i++;n={t:'not',a:n}}return n};
  const atom=()=>{const c=t[i++];
    if(c===undefined)throw new Error('The expression ends too early.');
    if(c==='('){const n=orE();if(t[i]!==')')throw new Error('A closing bracket is missing.');i++;return{t:'grp',a:n}}
    if(c==='0'||c==='1')return{t:'const',v:+c};
    if('ABCD'.includes(c))return{t:'var',n:c};
    throw new Error(`“${c}” is in the wrong place.`)};
  const tree=orE();if(i<t.length)throw new Error(`“${t[i]}” is in the wrong place.`);return tree;
}
function ev(n,e){switch(n.t){case'var':return e[n.n];case'const':return n.v;case'grp':return ev(n.a,e);case'not':return 1-ev(n.a,e);case'and':return ev(n.a,e)&ev(n.b,e);case'or':return ev(n.a,e)|ev(n.b,e);case'xor':return ev(n.a,e)^ev(n.b,e)}}
function varsOf(n,s=new Set()){if(n.t==='var')s.add(n.n);if(n.a)varsOf(n.a,s);if(n.b)varsOf(n.b,s);return[...s].sort()}
const PREC={or:1,xor:2,and:3,not:4,var:5,const:5,grp:5};
function show(n,nota=NOTA,parent=0){
  const S=SYM[nota];let out;
  switch(n.t){
    case'var':return n.n;case'const':return String(n.v);
    case'grp':return'('+show(n.a,nota,0)+')';
    case'not':if(nota==='alg')return`<span class="ob">${show(n.a.t==='grp'?n.a.a:n.a,nota,0)}</span>`;out=S.not+show(n.a,nota,4);break;
    default:out=show(n.a,nota,PREC[n.t])+S[n.t]+show(n.b,nota,PREC[n.t]);
  }
  return PREC[n.t]<parent?'('+out+')':out;
}
function envFor(row,vars){const e={};vars.forEach((v,k)=>e[v]=(row>>(vars.length-1-k))&1);return e}
function bindNotation(rerender){
  const seg=$('#nota');
  const sync=()=>seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',b.dataset.n===NOTA));
  seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;NOTA=b.dataset.n;sync();rerender()});
  sync();
}
