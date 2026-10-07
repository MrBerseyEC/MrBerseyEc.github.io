/* Runnable Python editors (Pyodide + CodeMirror). Load after site.js.
   Every <div class="py"><textarea>code</textarea></div> becomes an editor with its own console.
   Add data-vars to also show a table of the program's variables after it finishes. */
const PYODIDE='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';

/* Python runs on the main thread, so the program is rewritten before it runs: input(), time.sleep()
   and calls to the student's own subprograms are awaited, and every loop pauses now and then so the
   page can redraw and the Stop button works. Line numbers are kept, so errors point at the right line. */
const HARNESS=String.raw`
import ast, sys, json, time, inspect, traceback
import pyrun_js as _js

class _Stop(BaseException): pass

class _Done:
    def __init__(self, v): self.v = v
    def __await__(self):
        return self.v
        yield

def _aw(x):
    return x if inspect.isawaitable(x) else _Done(x)

class _Out:
    def __init__(self): self.buf = []; self.chars = 0; self.lines = 0
    def write(self, s):
        s = str(s)
        self.chars += len(s); self.lines += s.count('\n')
        if self.chars > 200000 or self.lines > 5000:
            self.flush()
            raise _Stop('Stopped: too much output. Is a loop running forever?')
        self.buf.append(s)
        return len(s)
    def flush(self):
        if self.buf: _js.out(''.join(self.buf)); self.buf = []

_out = _Out()
_n = 0
_t = 0.0

def _tick():
    global _n
    _n += 1
    return not (_n & 255) and time.monotonic() - _t > 0.03

async def _pause():
    global _t
    _out.flush()
    await _js.pause()
    _t = time.monotonic()
    if _js.stopped(): raise _Stop()

async def _input(prompt=''):
    global _t
    _out.write(prompt); _out.flush()
    s = await _js.input()
    _t = time.monotonic()
    if _js.stopped(): raise _Stop()
    return s

async def _sleep(secs):
    global _t
    _out.flush()
    await _js.sleep(secs * 1000)
    _t = time.monotonic()
    if _js.stopped(): raise _Stop()

def _yields(fn):
    stack = list(fn.body)
    while stack:
        n = stack.pop()
        if isinstance(n, (ast.Yield, ast.YieldFrom)): return True
        if not isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef)):
            stack.extend(ast.iter_child_nodes(n))
    return False

def _funcs(tree):
    out = set()
    def walk(n):
        for c in ast.iter_child_nodes(n):
            if isinstance(c, (ast.ClassDef, ast.Lambda)): continue
            if isinstance(c, ast.FunctionDef):
                if _yields(c): continue
                out.add(c.name)
            walk(c)
    walk(tree)
    return out

class _Rewrite(ast.NodeTransformer):
    def __init__(self, funcs): self.funcs = funcs
    def visit_ClassDef(self, node): return node
    def visit_Lambda(self, node): return node
    def visit_GeneratorExp(self, node): return node
    def visit_FunctionDef(self, node):
        if node.name not in self.funcs or _yields(node): return node
        self.generic_visit(node)
        return ast.copy_location(ast.AsyncFunctionDef(**{f: getattr(node, f) for f in node._fields}), node)
    def visit_Call(self, node):
        self.generic_visit(node)
        f = node.func
        if isinstance(f, ast.Attribute) and f.attr == 'sleep' and isinstance(f.value, ast.Name) and f.value.id == 'time':
            node.func = ast.copy_location(ast.Name('__sleep__', ast.Load()), f)
        elif not (isinstance(f, ast.Name) and (f.id == 'input' or f.id in self.funcs)):
            return node
        wrap = ast.copy_location(ast.Call(ast.Name('__aw__', ast.Load()), [node], []), node)
        return ast.copy_location(ast.Await(wrap), node)
    def _loop(self, node):
        self.generic_visit(node)
        check = ast.parse('if __tick__(): await __pause__()').body[0]
        for n in ast.walk(check): ast.copy_location(n, node)
        node.body.insert(0, check)
        return node
    visit_For = visit_While = _loop

async def _pyrun(src):
    global _out, _t
    _out = _Out()
    old = sys.stdout
    sys.stdout = _out
    ns = {'__name__': '__main__', 'input': _input, '__aw__': _aw, '__sleep__': _sleep, '__tick__': _tick, '__pause__': _pause}
    res = {'ok': True}
    try:
        tree = ast.parse(src, 'program')
        tree = ast.fix_missing_locations(_Rewrite(_funcs(tree)).visit(tree))
        code = compile(tree, 'program', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        _t = time.monotonic()
        r = eval(code, ns)
        if inspect.iscoroutine(r): await r
    except _Stop as e:
        res = {'stopped': True, 'msg': str(e)}
    except SyntaxError as e:
        res = {'line': e.lineno, 'msg': type(e).__name__ + ': ' + str(e.msg)}
    except BaseException as e:
        line = None
        for f in traceback.extract_tb(e.__traceback__):
            if f.filename == 'program': line = f.lineno
        res = {'line': line, 'msg': ''.join(traceback.format_exception_only(type(e), e)).strip()}
    finally:
        sys.stdout = old
    try: _out.flush()
    except _Stop: pass
    res['vars'] = []
    for k, v in ns.items():
        if k.startswith('_') or k == 'input' or inspect.ismodule(v) or callable(v): continue
        r = repr(v)
        res['vars'].append([k, r if len(r) <= 90 else r[:87] + '...', type(v).__name__])
    return json.dumps(res)
`;

const pyRun={token:0,stop:false,wake:null,active:null,job:Promise.resolve(),py:null};
function pyHalt(){pyRun.stop=true;if(pyRun.wake)pyRun.wake()}
function pyLoad(){
  return pyRun.py||(pyRun.py=(async()=>{
    if(!window.loadPyodide)await new Promise((ok,no)=>{const s=document.createElement('script');s.src=PYODIDE+'pyodide.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
    const p=await loadPyodide({indexURL:PYODIDE});
    p.registerJsModule('pyrun_js',{
      out:s=>pyRun.active&&pyRun.active.print(s),
      stopped:()=>pyRun.stop,
      pause:()=>new Promise(r=>setTimeout(r,0)),
      sleep:ms=>new Promise(r=>{const t=setTimeout(done,Math.max(0,ms)||0);function done(){clearTimeout(t);pyRun.wake=null;r()}pyRun.wake=done}),
      input:()=>new Promise(r=>pyRun.active.ask(r))});
    p.runPython(HARNESS);
    return p.globals.get('_pyrun');
  })().catch(e=>{pyRun.py=null;throw e}));
}

function pyMount(el){
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const src=el.querySelector('textarea').value.replace(/^\s*\n|\s+$/g,'');
  el.innerHTML=`<div class="py-bar"><button class="btn pri py-run" title="Ctrl + Enter">▶ Run</button><button class="btn py-stop" disabled>■ Stop</button><button class="btn py-reset">Reset code</button><span class="py-status" role="status"></span></div>
<div class="py-main"><div><div class="py-label">Code</div><div class="py-ed"></div></div>
<div><div class="py-label">Output</div><pre class="py-out"></pre><div class="py-vars hidden"></div></div></div>`;
  const q=s=>el.querySelector(s),out=q('.py-out'),status=q('.py-status'),varsEl=q('.py-vars');
  const w={
    print(s){const last=out.lastChild;if(last&&last.nodeType===3)last.appendData(s);else out.append(s);out.scrollTop=out.scrollHeight},
    ask(resolve){
      const inp=document.createElement('input');inp.className='py-in';inp.setAttribute('aria-label','Type your input and press Enter');
      inp.autocomplete='off';inp.spellcheck=false;out.append(inp);out.scrollTop=out.scrollHeight;inp.focus();
      status.textContent='Waiting for you to type, then press Enter';
      const done=v=>{pyRun.wake=null;inp.remove();if(v!==null)w.print(v+'\n');status.textContent='Running…';resolve(v||'')};
      inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();done(inp.value)}};
      pyRun.wake=()=>done(null)},
  };
  let errLine=null,cm=null;
  const clearErr=()=>{if(cm&&errLine!==null)cm.removeLineClass(errLine,'background','py-errline');errLine=null};
  const start=()=>{const my=++pyRun.token;pyHalt();pyRun.job=pyRun.job.then(()=>exec(my))};
  if(window.CodeMirror){
    cm=CodeMirror(q('.py-ed'),{value:src,mode:'python',lineNumbers:true,indentUnit:4,viewportMargin:Infinity,
      extraKeys:{Tab:c=>c.somethingSelected()?c.indentSelection('add'):c.replaceSelection('    ','end'),'Shift-Tab':c=>c.indentSelection('subtract'),'Ctrl-Enter':start,'Cmd-Enter':start}});
    cm.on('change',clearErr);
  }else{q('.py-ed').innerHTML='<textarea spellcheck="false"></textarea>';q('.py-ed textarea').value=src}
  const code=()=>cm?cm.getValue():q('.py-ed textarea').value;
  async function exec(my){
    if(my!==pyRun.token)return;
    pyRun.stop=false;pyRun.active=w;out.textContent='';varsEl.classList.add('hidden');clearErr();
    status.className='py-status';status.textContent=pyRun.loaded?'Running…':'Loading Python (first run only)…';
    q('.py-stop').disabled=false;
    let res;
    try{
      const run=await pyLoad();pyRun.loaded=true;
      if(pyRun.stop)res={stopped:true,msg:''};
      else{status.textContent='Running…';res=JSON.parse(await run(code()))}
    }catch(e){res=pyRun.loaded?{msg:String(e)}:{msg:'Could not load Python. Check your internet connection, then press Run again.'}}
    q('.py-stop').disabled=true;
    if(res.ok){status.textContent='Finished ✔';status.classList.add('okc')}
    else{
      const s=document.createElement('span');s.className=res.stopped?'py-note':'py-err';
      const head=res.stopped?'':res.line?`Error on line ${res.line}\n`:'Error\n';
      s.textContent=(out.textContent&&!out.textContent.endsWith('\n')?'\n':'')+head+(res.msg||'');
      if(s.textContent.trim())out.append(s);out.scrollTop=out.scrollHeight;
      status.textContent=res.stopped?'Stopped':res.line?`Error on line ${res.line}`:'Error';
      if(!res.stopped)status.classList.add('badc');
      if(!res.stopped&&res.line&&cm&&res.line<=cm.lineCount()){errLine=res.line-1;cm.addLineClass(errLine,'background','py-errline')}
    }
    if(el.hasAttribute('data-vars')&&res.vars&&res.vars.length){
      varsEl.innerHTML='<div class="py-label">Variables when the program ended</div><div class="scroll"><table class="t"><tr><th>Name</th><th>Value</th><th>Data type</th></tr>'+
        res.vars.map(v=>`<tr><td class="mono">${esc(v[0])}</td><td class="mono">${esc(v[1])}</td><td class="mono">${esc(v[2])}</td></tr>`).join('')+'</table></div>';
      varsEl.classList.remove('hidden');
    }
  }
  q('.py-run').onclick=start;
  q('.py-stop').onclick=pyHalt;
  q('.py-reset').onclick=()=>{if(cm){cm.setValue(src);cm.focus()}else q('.py-ed textarea').value=src};
}

document.querySelectorAll('.py').forEach(pyMount);
/* start fetching Python straight away so the first Run is quick */
pyLoad().catch(()=>{});
