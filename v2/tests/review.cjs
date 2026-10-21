/* Run: NODE_PATH=/path/to/node_modules node v2/tests/review.cjs */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<div id="app"></div><div id="toast"></div>',{url:'https://example.com/Debitar-Back-Office/v2/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.alert=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addListener(){}});
 w.localStorage.setItem('debitar_ops','ORIGINAL_SENTINEL');
 const run=code=>w.eval(code);
 for(const name of ['app.js','v2-ui.js']){let script=w.document.createElement('script');script.textContent=fs.readFileSync('v2/'+name,'utf8');w.document.body.append(script)}
 for(const button of w.document.querySelectorAll('.v2-menuitem')){button.click();assert.equal(button.getAttribute('aria-expanded'),'true');button.click();assert.equal(button.getAttribute('aria-expanded'),'false')}
 const routes=[...w.document.querySelectorAll('[data-v2sub]')].map(b=>[b.dataset.v2nav,b.dataset.v2sub]);
 for(const [page,label] of routes){let b=[...w.document.querySelectorAll('[data-v2sub]')].find(x=>x.dataset.v2nav===page&&x.dataset.v2sub===label);b.click();assert(w.document.querySelector('#view').textContent.trim(),label);assert(!/prevista para la siguiente/.test(w.document.querySelector('#view').textContent),label);if(label==='Respaldos JSON')assert(w.document.querySelector('#import'));console.log('OK submenu:',label)}
 // Specialized views must retain operational controls.
 const click=label=>[...w.document.querySelectorAll('[data-v2sub]')].find(x=>x.dataset.v2sub===label).click();
 click('Bancos y cuentas');assert(w.document.querySelector('[data-act="income"]'));assert(w.document.querySelector('[data-act="reconcile"]'));
 click('Calendario y vencimientos');assert(w.document.querySelector('[data-act="newtask"]'));assert(w.document.querySelector('[data-followup-new]'));
 click('Cartera y fichas');assert(w.document.querySelector('[data-portfolio-toggle]'));assert(w.document.querySelector('[data-client-ops]'));
 let search=w.document.querySelector('#v2-client-search');search.value='not-a-client-123';search.dispatchEvent(new w.Event('input'));assert([...w.document.querySelectorAll('.portfolio-row')].every(r=>r.hidden));
 click('Gestiones por cliente');assert(w.document.querySelector('[data-client-ops]'));
 // Legacy navigation clears previous subsection.
 run("page='Inicio';shell()");assert.equal(w.document.querySelector('h1').textContent,'Inicio');w.document.querySelector('[data-p="DEBITAR"]').click();assert.equal(w.document.querySelector('h1').textContent,'Clientes');
 // Import an exported-shaped JSON in this isolated DOM, retaining independent storage.
 const backup=run('JSON.stringify(state)');
 run('window.qaImportDone=false');
 const file=new w.File([backup],'backup.json',{type:'application/json'});
 run('window.qaImport=importData');w.qaImport({target:{files:[file]}});
 await new Promise(resolve=>w.setTimeout(resolve,50));
 assert.equal(run('state.clients.length'),JSON.parse(backup).clients.length);
 assert.equal(w.localStorage.getItem('debitar_ops'),'ORIGINAL_SENTINEL');
 // Client validation and copy-on-save preserve the existing object/vault on failure.
 run("clientModal(state.clients[0].id)");let before=run('JSON.stringify(state.clients[0])');
 w.document.querySelector('#name').value='';await w.document.querySelector('#save').onclick();assert.equal(run('JSON.stringify(state.clients[0])'),before);assert(w.document.querySelector('#clientError').textContent);
 w.document.querySelector('#name').value='Cliente QA';w.document.querySelector('#day').value=32;await w.document.querySelector('#save').onclick();assert.equal(run('JSON.stringify(state.clients[0])'),before);
 w.document.querySelector('#day').value=15;await w.document.querySelector('#save').onclick();assert.equal(run('state.clients[0].name'),'Cliente QA');assert.equal(JSON.parse(w.localStorage.getItem('debitar_ops_v2')).clients[0].name,'Cliente QA');
 run("state.clients[1].rut='12.345.678-5';clientModal()");w.document.querySelector('#name').value='Duplicado';w.document.querySelector('#rut').value='12345678-5';let count=run('state.clients.length');await w.document.querySelector('#save').onclick();assert.equal(run('state.clients.length'),count);assert.match(w.document.querySelector('#clientError').textContent,/RUT/);w.document.querySelector('.modal-bg').remove();
 run("state.periodControl[state.selectedMonth].status='closed';save();shell()");click('Cartera y fichas');assert.match(w.document.querySelector('#view').textContent,/Período cerrado/);assert(!w.document.querySelector('[data-act="newclient"]'));
 assert.equal(w.localStorage.getItem('debitar_ops'),'ORIGINAL_SENTINEL');assert.deepEqual(errors,[]);dom.window.close();
 // Service worker must never delete the original cache or cache failed/POST requests.
 const handlers={},deleted=[],puts=[],cached=new Map(),scope='https://example.com/Debitar-Back-Office/v2/sw.js';
 const cache={addAll:async assets=>{for(const a of assets){const p=new URL(a,scope).pathname;assert(fs.existsSync(p.replace('/Debitar-Back-Office/','')),a)}},put:async(req,res)=>puts.push(req.url),match:async req=>cached.get(req.url)};
 const ctx={URL,Response,self:{location:new URL(scope),clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>handlers[n]=f},caches:{open:async()=>cache,keys:async()=>['debitar-v1106','debitar-v2001','debitar-v2-old','debitar-v2-2010'],delete:async k=>deleted.push(k)},fetch:async()=>new Response('ok')};
 vm.runInNewContext(fs.readFileSync('v2/sw.js','utf8'),ctx);
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['debitar-v2-old']);
 const event=(path,method='GET')=>{let result;handlers.fetch({request:{url:new URL(path,scope).href,method},respondWith:p=>result=p});return result};
 assert.equal(event('../index.html'),undefined);assert.equal(event('app.js','POST'),undefined);
 await event('app.js?v=2010');assert.equal(puts.length,1);ctx.fetch=async()=>new Response('fail',{status:500});await event('app.js');assert.equal(puts.length,1);
 ctx.fetch=async()=>{throw Error('offline')};cached.set(new URL('app.js?v=2010',scope).href,new Response('cached'));assert.equal(await (await event('app.js?v=2010')).text(),'cached');
 console.log('PASS:',routes.length,'submenus; client validation/persistence; period lock; isolated offline cache.');
})().catch(e=>{console.error(e);process.exit(1)});
