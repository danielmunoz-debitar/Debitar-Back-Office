/* DEBITAR 2.0 — isolated presentation layer; original business functions retained. */
(function(){
 const oldDashboard=dashboard;
 /* Batch task completion: selection only; no deletion or change to completed tasks. */
 const originalTasksPage=tasksPage;
 tasksPage=function(){
  const html=originalTasksPage();
  const pending=(state.tasks||[]).filter(t=>t.status!=='Hecha');
  if(!pending.length)return html;
  const controls='<div class="v2-bulkbar"><label><input type="checkbox" id="v2-task-all"> Seleccionar pendientes</label><button type="button" class="btn" id="v2-task-complete" disabled>Marcar seleccionadas como realizadas</button><span id="v2-task-selected">0 seleccionadas</span></div>';
  const withRows=html.replace(/<tr><td><button class="btn ([^"]*)" data-task-toggle="([^"]+)"/g,(match,cls,id)=>{
   const t=state.tasks.find(x=>String(x.id)===id);
   return '<tr><td>'+(t&&t.status!=='Hecha'?'<input class="v2-task-select" type="checkbox" value="'+esc(id)+'" aria-label="Seleccionar tarea">':'')+'</td><td><button class="btn '+cls+'" data-task-toggle="'+id+'"';
  });
  return withRows.replace('<th>Estado</th>','<th>Seleccionar</th><th>Estado</th>').replace('<div class="section"><h2>Agenda de trabajo</h2></div>',controls+'<div class="section"><h2>Agenda de trabajo</h2></div>');
 };
 document.addEventListener('change',e=>{
  if(e.target.id==='v2-task-all'){document.querySelectorAll('#view .v2-task-select').forEach(x=>x.checked=e.target.checked)}
  else if(!e.target.matches('#view .v2-task-select'))return;
  const checked=document.querySelectorAll('#view .v2-task-select:checked').length;
  const button=document.querySelector('#v2-task-complete'),counter=document.querySelector('#v2-task-selected');
  if(button)button.disabled=!checked;if(counter)counter.textContent=checked+' seleccionadas';
 });
 document.addEventListener('click',e=>{
  if(e.target.id!=='v2-task-complete')return;
  const ids=[...document.querySelectorAll('#view .v2-task-select:checked')].map(x=>x.value);
  const eligible=(state.tasks||[]).filter(t=>ids.includes(String(t.id))&&t.status!=='Hecha');
  if(!eligible.length)return;
  if(!window.confirm('¿Marcar '+eligible.length+' tareas seleccionadas como realizadas? Esta acción actualizará sus estados.'))return;
  eligible.forEach(t=>{t.status='Hecha'});
  save(eligible.length+' tareas marcadas como realizadas');
  render();
 });

 const NAV=[['Inicio','⌂','Inicio'],['Clientes','▣','DEBITAR'],['Finanzas','◫','Finanzas'],['Gastos','↓','Gastos'],['Deudas','◇','Deudas'],['Tareas y operaciones','✓','Tareas'],['Reportes','▤','Reportes'],['Documentos','▧','Documentos'],['Configuración','⚙','Configuración']];
 const mainPage=p=>p==='DEBITAR'?'Clientes':p;
 const esc2=s=>esc(s);
 const oldRender=render;
 dashboard=function(){
  const m=metrics(),due=Number(m.due)||0,paid=Number(m.paid)||0;
  const pending=Math.max(0,Number(m.pending??(due-paid))||0);
  const share=due?Math.min(100,Math.max(0,paid/due*100)):0;
  const cards=[
   ['Ingresos del mes',fmt(m.income),'Trabajo · DEBITAR · otros'],
   ['Pendiente por pagar',fmt(pending),'Disminuye al registrar pagos'],
   ['Cobranza DEBITAR',fmt(Math.max(0,m.expectedDebitar-m.debitar)),'Honorarios aún por cobrar'],
   ['Resultado proyectado',fmt(m.result),'Ingresos menos obligaciones']
  ];
  return '<div class="v2-welcome"><div><p class="v2-eyebrow">RESUMEN FINANCIERO · '+esc2(state.selectedMonth)+'</p><h2>Tu centro de operaciones</h2><p>Información del período seleccionado, con los registros de esta versión.</p></div><button class="btn" data-p="DEBITAR">Ver clientes →</button></div>'+
   '<div class="v2-kpis">'+cards.map(c=>'<div class="v2-stat"><small>'+c[0]+'</small><strong>'+c[1]+'</strong><span>'+c[2]+'</span></div>').join('')+'</div>'+
   '<div class="v2-panels"><div class="card v2-panel"><div class="section"><h2>Control de gastos del mes</h2><span class="pill">'+esc2(state.selectedMonth)+'</span></div>'+
   '<div class="v2-amount">'+fmt(pending)+'</div><p class="muted">Saldo pendiente por pagar</p>'+
   '<div class="v2-meter"><div style="width:'+share+'%"></div></div>'+
   '<div class="v2-split"><span>Pagado <b>'+fmt(paid)+'</b></span><span>'+Math.round(share)+'% ejecutado</span></div>'+
   '<div class="v2-total"><span>Total gastos y obligaciones del mes</span><strong>'+fmt(due)+'</strong></div>'+
   '<div class="actions"><button class="btn ghost" data-p="Gastos">Ver gastos</button><button class="btn ghost" data-p="Deudas">Ver deudas</button></div></div>'+
   '<div class="card v2-panel"><div class="section"><h2>Accesos rápidos</h2></div><div class="v2-quick">'+
   [['DEBITAR','Clientes y cobranza'],['Finanzas','Flujo de caja'],['Tareas','Tareas y vencimientos'],['Reportes','Informes'],['Configuración','Respaldos JSON']].map(a=>'<button class="v2-quickbutton" data-p="'+a[0]+'">'+a[1]+' <span>↗</span></button>').join('')+
   '</div><p class="muted">Indicadores calculados a partir de los registros disponibles en esta versión.</p></div></div>'+
   '<div class="v2-analytics">'+
   '<section class="v2-analytics-card"><h3>¿Dónde va mi dinero?</h3><p>Distribución de gastos comprometidos por categoría</p>'+expenseChart()+'</section>'+
   '<section class="v2-analytics-card"><h3>Prorrateo y planificación mensual</h3><p>Comparación de compromisos del período y proyección</p>'+monthProjection()+'</section>'+
   '<section class="v2-analytics-card"><h3>Camino a la meta ideal</h3><p>Objetivos y brecha mensual de ingresos</p>'+goalProgress()+'</section>'+
   '</div>';
 };

 function expenseChart(){
  const rows=monthExpenses(),debt=debtsM().reduce((a,d)=>a+(Number(d.amount)||0),0);
  const by={};rows.forEach(e=>{const key=e.category||'Sin categoría';by[key]=(by[key]||0)+(Number(e.amount)||0);});if(debt)by['Cuotas de deudas']=(by['Cuotas de deudas']||0)+debt;
  const total=Object.values(by).reduce((a,b)=>a+b,0);
  if(!total)return '<p class="v2-empty">Sin gastos registrados para el período.</p>';
  const palette=['#52d3e5','#8158cb','#ffbf6b','#69bda6','#ed82a8','#9ba8d8','#7a9ab2','#d5c07d'];
  const sorted=Object.entries(by).sort((a,b)=>b[1]-a[1]);
  let cum=0;const segments=sorted.map(([name,v],i)=>{const from=cum/total*100;cum+=v;return palette[i%palette.length]+' '+from+'% '+(cum/total*100)+'%';});
  return '<div class="v2-chartlayout"><div class="v2-donut" style="background:conic-gradient('+segments.join(',')+')"><div><b>'+fmt(total)+'</b><small>Gasto mensual</small></div></div><div class="v2-chartlegend">'+sorted.map(([name,v],i)=>'<div><span class="v2-dot" style="background:'+palette[i%palette.length]+'"></span><span>'+esc2(name)+'</span><b>'+fmt(v)+'</b><small>'+Math.round(v/total*100)+'%</small></div>').join('')+'</div></div>';
 }
 function monthProjection(){
  const current=state.selectedMonth;const months=[];
  for(let i=0;i<4;i++){const [y,m]=current.split('-').map(Number);const d=new Date(y,m-1+i,1);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');months.push({key:k,metrics:metrics(k)});}
  const max=Math.max(1,...months.map(x=>x.metrics.due));
  return '<div class="v2-monthbars">'+months.map(x=>'<div class="v2-monthrow"><b>'+esc2(x.key)+'</b><div class="v2-monthtrack"><span style="width:'+Math.round(x.metrics.due/max*100)+'%"></span></div><strong>'+fmt(x.metrics.due)+'</strong></div>').join('')+'</div><p class="v2-footnote">Proyección basada en gastos recurrentes y cuotas registradas. No supone que todos los compromisos futuros estén ingresados.</p>';
 }
 function goalProgress(){
  const m=metrics(),goals=Array.isArray(state.objectives)?state.objectives:[];
  const target=3000000;const progress=Math.max(0,Math.min(100,m.income/target*100));
  return '<div class="v2-goal"><div class="v2-goalnumbers"><span>Ingreso registrado del mes</span><strong>'+fmt(m.income)+'</strong></div><div class="v2-meter"><div style="width:'+progress+'%"></div></div><div class="v2-goalnumbers"><span>Meta de referencia</span><strong>'+fmt(target)+'</strong></div><div class="v2-goalgap">Brecha para alcanzar la meta: <b>'+fmt(Math.max(0,target-m.income))+'</b></div><p class="v2-footnote">Meta referencial editable en una próxima etapa. Los ingresos proyectados no equivalen a cobros realizados.</p>'+goals.slice(0,3).map(o=>'<div class="v2-goalitem"><span>'+esc2(o.name)+'</span><b>'+fmt(o.current)+' / '+fmt(o.target)+'</b></div>').join('')+'</div>';
 }

 let v2Section='',v2Page=page;
 const redraw=render;
 render=function(){redraw(); if(v2Section && (!state.periodControl || state.periodControl[state.selectedMonth]?.status==='open'))applySubsection(); if(page==='Inicio')document.querySelectorAll('#view [data-p]').forEach(b=>b.onclick=()=>{page=b.dataset.p;v2Section='';shell()});};
 function titleFor(){return v2Section||mainPage(page)}
 function applySubsection(){
  const root=document.querySelector('#view');if(!root)return;
  const label=v2Section;const text=label.toLocaleLowerCase('es-CL');
  // Every submenu renders a deliberate view. Do not search arbitrary nested card text.
  if(page!=='DEBITAR'){
   const template=(heading,description,body)=>'<div class="v2-specialized"><div class="v2-sectionintro"><h2>'+esc2(heading)+'</h2><p>'+description+'</p></div>'+body+'</div>';
   const pick=(source,indices)=>{
    const tmp=document.createElement('div');tmp.innerHTML=source;
    return indices.map(i=>tmp.children[i]?.outerHTML||'').join('');
   };
   const fin=()=>finances(),task=()=>tasksPage(),ub=()=>uber(),rep=()=>reports(),set=()=>settings();
   let content=null;
   switch(page+'|'+label){
    case 'Finanzas|Flujo de caja':{
     const m=metrics();
     content=template(label,'Resumen de entradas, obligaciones y resultado del período '+esc2(state.selectedMonth)+'.',
      '<div class="grid three">'+kpi('Ingresos registrados',fmt(m.income))+kpi('Obligaciones del mes',fmt(m.due))+kpi('Resultado proyectado',fmt(m.result))+'</div><div class="v2-sectionlinks"><button class="btn ghost" data-v2goto="Bancos y cuentas">Bancos y cuentas</button><button class="btn ghost" data-v2goto="Ingresos">Ver ingresos</button><button class="btn ghost" data-v2page="Gastos">Gastos</button><button class="btn ghost" data-v2page="Deudas">Deudas</button></div>');break;
    }
    case 'Finanzas|Bancos y cuentas':
     content=template(label,'Saldos de las cuentas registradas y transferencias.',fin());break;
    case 'Finanzas|Ingresos':
     content=template(label,'Movimientos de ingresos registrados para el período.',fin());break;
    case 'Uber|Turno y viajes':
     content=template(label,'Registro de turnos, resultados e historial de viajes.',ub());break;
    case 'Uber|Billetera y combustible':{
     const m=metrics();
     content=template(label,'Resultado económico de Uber y acceso a la gestión de combustible y turnos.',
      '<div class="grid three">'+kpi('Neto económico',fmt(m.uber))+kpi('Horas Uber',num(m.uberHours)+' h')+kpi('Meta faltante',fmt(m.uberMissing))+'</div>'+ub()+
      '<div class="v2-sectionlinks"><button class="btn ghost" data-v2goto="Turno y viajes">Ver historial de turnos</button><button class="btn ghost" data-v2page="Finanzas">Ver cuentas y billeteras</button></div>');break;
    }
    case 'Tareas|Tareas pendientes':
     content=template(label,'Tareas registradas, prioridades, fechas y seguimiento.',task());break;
    case 'Tareas|Calendario y vencimientos':
     content=template(label,'Agenda y vencimientos asociados a las tareas existentes.',task());break;
    case 'Reportes|Informes':
    case 'Reportes|Informes financieros':
     content=template(label,'Resultados históricos y flujo de caja del período.',rep());break;
    case 'Configuración|Parámetros':
     content=template(label,'Configuración general del Centro de Operaciones.',pick(set(),[0]));break;
    case 'Configuración|Respaldos JSON':
     content=template(label,'Exportación y restauración de datos de esta versión.',
       '<div class="v2-backup">'+pick(set(),[0])+'</div>');break;
   }
   if(content!==null){
    root.innerHTML=content;
    if(page==='Configuración'&&label==='Parámetros')root.querySelectorAll('.card')[1]?.remove();
    if(page==='Configuración'&&label==='Respaldos JSON')root.querySelectorAll('.card')[0]?.remove();
    bind();
    root.querySelectorAll('[data-v2goto]').forEach(b=>b.onclick=()=>{v2Section=b.dataset.v2goto;shell()});
    root.querySelectorAll('[data-v2page]').forEach(b=>b.onclick=()=>{page=b.dataset.v2page;v2Section='';shell()});
    return;
   }
  }
  if(page==='DEBITAR'){
   const clients=state.clients||[],prospects=state.prospects||[],collections=collectionsM();
   const card=(title,desc,body)=>'<section class="v2-subcard"><h2>'+title+'</h2><p>'+desc+'</p>'+body+'</section>';
   const table=(headers,rows)=>'<div class="v2-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
   if(text.includes('prospect')){
    root.innerHTML=card('Prospectos','Seguimiento comercial de oportunidades registradas.','<button class="btn" data-act="newprospect">+ Nuevo prospecto</button>'+table(['Prospecto','Estado','Detalle','Acción'],prospects.map(p=>'<tr><td>'+esc2(p.name||p.company||'Sin nombre')+'</td><td>'+esc2(p.status||'En seguimiento')+'</td><td>'+esc2(p.note||p.notes||'—')+'</td><td><button class="btn ghost sm" data-prospect-edit="'+esc2(p.id)+'">Editar</button></td></tr>'))+(prospects.length?'':'<p>No hay prospectos registrados.</p>'));
   }else if(text.includes('cobranza')||text.includes('honorario')){
    root.innerHTML=card('Honorarios y cobranza','Estado de cobro correspondiente al período '+esc2(state.selectedMonth)+'.',table(['Cliente','Honorario','Estado','Acción'],clients.filter(c=>c.active).map(c=>{const co=collections.find(x=>x.clientId===c.id);return '<tr><td>'+esc2(c.name)+'</td><td>'+fmt(c.fee)+'</td><td><span class="v2-state '+(co?.status==='Cobrado'?'paid':'')+'">'+(co?.status==='Cobrado'?'Cobrado':'Pendiente')+'</span></td><td>'+(co?.status==='Cobrado'?'<button class="btn ghost sm" data-client="'+c.id+'">Ver ficha</button>':'<button class="btn sm" data-collect="'+c.id+'">Registrar cobro</button>')+'</td></tr>';})));
   }else if(text.includes('gestiones')){
    root.innerHTML=monthlyControlBlock();bind();return;

   }else{
    const active=clients.filter(c=>c.active),inactive=clients.length-active.length;
    const monthly=active.reduce((sum,c)=>sum+(Number(c.fee)||0),0);
    const kpis='<div class="v2-kpis v2-portfolio-kpis">'+[
      ['Clientes activos',String(active.length)],['Honorarios mensuales',fmt(monthly)],
      ['Clientes inactivos',String(inactive)],['Total de fichas',String(clients.length)]
    ].map(([name,value])=>'<div class="v2-stat"><small>'+name+'</small><strong>'+value+'</strong></div>').join('')+'</div>';
    const rows=clients.map(c=>'<tr class="v2-client-row" data-status="'+(c.active?'active':'inactive')+'" data-search="'+esc2([c.name,c.rut,c.email,c.phone].filter(Boolean).join(' ').toLocaleLowerCase('es-CL'))+'"><td><strong>'+esc2(c.name||'Sin nombre')+'</strong></td><td><span class="v2-state '+(c.active?'paid':'')+'">'+(c.active?'Activo':'Inactivo')+'</span></td><td>'+fmt(c.fee)+'</td><td>'+esc2(c.day||c.paymentDay||'—')+'</td><td><button class="btn ghost sm" data-client="'+esc2(c.id)+'">Ver / editar ficha</button></td></tr>');
    root.innerHTML='<div class="v2-portfolio">'+kpis+
      '<section class="v2-subcard"><div class="v2-portfolio-toolbar"><div><h2>Cartera de clientes</h2><p>Información esencial. Abre cada ficha para consultar o modificar los demás datos.</p></div><div class="v2-portfolio-actions"><button class="btn ghost sm" data-v2portfolio="Cobranza">Cobranza</button><button class="btn ghost sm" data-v2portfolio="Gestiones por cliente">Gestiones</button></div></div>'+
      '<div class="v2-portfolio-filters"><label class="field">Buscar cliente<input id="v2-client-search" type="search" placeholder="Nombre, RUT o contacto" autocomplete="off"></label><label class="field">Estado<select id="v2-client-status"><option value="active">Activos</option><option value="all">Todos</option><option value="inactive">Inactivos</option></select></label></div>'+
      '<p id="v2-client-count" role="status"></p>'+table(['Cliente','Estado','Honorario','Día de cobro','Ficha'],rows)+'</section></div>';
    const search=root.querySelector('#v2-client-search'),status=root.querySelector('#v2-client-status');
    const filter=()=>{let count=0;const q=search.value.trim().toLocaleLowerCase('es-CL');root.querySelectorAll('.v2-client-row').forEach(row=>{const ok=row.dataset.search.includes(q)&&(status.value==='all'||row.dataset.status===status.value);row.hidden=!ok;if(ok)count++});root.querySelector('#v2-client-count').textContent=count+' clientes visibles'};
    search.oninput=filter;status.onchange=filter;filter();
    root.querySelectorAll('[data-v2portfolio]').forEach(button=>button.onclick=()=>{v2Section=button.dataset.v2portfolio;shell()});
   }
   bind();return;
  }
  const selectors={
   'Finanzas':{'Bancos y cuentas':['.card','Cuentas'],'Ingresos':['.card','Ingresos registrados'],'Flujo de caja':['.card','Flujo'],'Gastos':['.card','Gastos']},
   'Uber':{'Billetera y combustible':['.card','Billetera'],'Turno y viajes':['.card','Turno']},
   'Tareas':{'Calendario y vencimientos':['.card','Agenda'],'Tareas pendientes':['.card','Tareas']},
   'Reportes':{'Informes financieros':['.card','Resultados']}
  };
  const config=selectors[page]?.[label];if(!config)return;
  const nodes=[...root.querySelectorAll(config[0])];
  const matches=nodes.filter(el=>el.textContent.toLocaleLowerCase('es-CL').includes(config[1].toLocaleLowerCase('es-CL')));
  if(matches.length){
   nodes.filter(el=>!matches.includes(el)).forEach(el=>el.classList.add('v2-filtered'));
  }else{
   root.innerHTML='<section class="v2-subcard"><h2>'+esc2(label)+'</h2><p>Esta vista especializada está prevista para la siguiente etapa. Puedes utilizar las funciones disponibles desde la pantalla general del módulo.</p><button class="btn" id="v2-overview">Abrir vista general</button></section>';
   document.querySelector('#v2-overview').onclick=()=>{v2Section='';shell()};
  }
 }
 function v2nav(){return NAV.map(([label,ico,target])=>'<button class="v2-navitem '+(page===target?'active':'')+'" data-v2nav="'+target+'"><span class="v2-icon">'+ico+'</span><span>'+label+'</span></button>').join('')}
 shell=function(){
  if(page!==v2Page){v2Section='';v2Page=page;}
  const menu=[
   ['Inicio','Inicio',[['Panel general','Inicio'],['Objetivos y metas','Objetivos']]],
   ['Clientes','DEBITAR',[['Cartera y fichas','DEBITAR'],['Prospectos','DEBITAR','Prospectos'],['Honorarios y cobranza','DEBITAR','Cobranza'],['Gestiones por cliente','DEBITAR','Clientes']]],
   ['Finanzas','Finanzas',[['Flujo de caja','Finanzas'],['Bancos y cuentas','Finanzas'],['Ingresos','Finanzas'],['Gastos','Gastos'],['Deudas y cuotas','Deudas'],['Metas y presupuestos','Objetivos']]],
   ['Tareas y operaciones','Tareas',[['Tareas pendientes','Tareas'],['Calendario y vencimientos','Tareas']]],
   ['Reportes','Reportes',[['Informes financieros','Reportes'],['Cobranza','DEBITAR','Cobranza']]],
   ['Documentos','Documentos',[['Archivos y plantillas','Documentos']]],
   ['Configuración','Configuración',[['Parámetros','Configuración'],['Respaldos JSON','Configuración']]]
  ];
  const menuHtml=menu.map(([label,target,items])=>'<div class="v2-dropdown"><button aria-haspopup="true" aria-expanded="false" class="v2-menuitem '+(page===target?'active':'')+'" data-v2nav="'+target+'">'+esc2(label)+' <span>⌄</span></button><div class="v2-dropcontent"><div class="v2-droptitle">'+esc2(label)+'</div><div class="v2-droplist">'+items.map(([name,p,anchor])=>'<button data-v2nav="'+p+'" '+'data-v2sub="'+esc2(name)+'"'+'><span class="v2-dropicon">↗</span><span>'+esc2(name)+'</span></button>').join('')+'</div></div></div>').join('');
  document.querySelector('#app').innerHTML='<div class="v2-hlayout"><header class="v2-hheader top"><div class="v2-hbrand"><img src="../debitar-logo.png" alt="DEBITAR"><span>CENTRO DE OPERACIONES · 3.0</span></div><div class="v2-hmeta"><label for="month">Período</label><input class="month" id="month" type="month" value="'+esc2(state.selectedMonth)+'"><span class="v2-avatar">D</span></div></header><nav class="v2-hnav"><button id="v2-mobile-menu" class="v2-mobile-menu">☰ Módulos</button><div class="v2-hnavitems" id="v2-hnavitems">'+menuHtml+'</div></nav><main class="v2-hmain"><div class="v2-hheading"><div><span class="v2-eyebrow">DEBITAR / '+esc2(titleFor())+'</span><h1>'+esc2(titleFor())+'</h1></div></div><div id="view"></div></main></div>';
  document.querySelectorAll('[data-v2nav]').forEach(b=>b.onclick=e=>{
   e.stopPropagation();
   if(b.classList.contains('v2-menuitem')){
    const dropdown=b.closest('.v2-dropdown'),open=!dropdown.classList.contains('v2-open');
    document.querySelectorAll('.v2-dropdown').forEach(d=>{d.classList.remove('v2-open');d.querySelector('.v2-menuitem').setAttribute('aria-expanded','false')});
    dropdown.classList.toggle('v2-open',open);b.setAttribute('aria-expanded',String(open));return;
   }
   page=b.dataset.v2nav;v2Page=page;
   v2Section=b.dataset.v2sub||'';
   shell();
  });
  document.querySelector('.v2-hnav').onkeydown=e=>{if(e.key==='Escape'){const d=e.target.closest('.v2-dropdown');if(d){d.classList.remove('v2-open');d.querySelector('.v2-menuitem').setAttribute('aria-expanded','false');e.target.blur();}}};
  document.querySelector('#v2-mobile-menu').onclick=()=>document.querySelector('#v2-hnavitems').classList.toggle('open');
  document.querySelector('#month').onchange=e=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value))return;state.selectedMonth=e.target.value;save();shell()};
  if(page==='Documentos'){document.querySelector('#view').innerHTML='<div class="card"><h2>Documentos</h2><p>Módulo en preparación. Los archivos actuales permanecen intactos.</p></div>';}else render();
 };
 shell();
})();
