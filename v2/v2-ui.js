/* DEBITAR 2.0 — isolated presentation layer; original business functions retained. */
(function(){
 const oldDashboard=dashboard;
 const NAV=[['Inicio','⌂','Inicio'],['Clientes','▣','DEBITAR'],['Finanzas','◫','Finanzas'],['Gastos','↓','Gastos'],['Deudas','◇','Deudas'],['Uber','▰','Uber'],['Tareas y operaciones','✓','Tareas'],['Reportes','▤','Reportes'],['Documentos','▧','Documentos'],['Configuración','⚙','Configuración']];
 const mainPage=p=>p==='DEBITAR'?'Clientes':p;
 const esc2=s=>esc(s);
 const oldRender=render;
 dashboard=function(){
  const m=metrics(),due=Number(m.due)||0,paid=Number(m.paid)||0;
  const pending=Math.max(0,Number(m.pending??(due-paid))||0);
  const share=due?Math.min(100,Math.max(0,paid/due*100)):0;
  const cards=[
   ['Ingresos del mes',fmt(m.income),'Trabajo · DEBITAR · Uber'],
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
   [['DEBITAR','Clientes y cobranza'],['Finanzas','Flujo de caja'],['Uber','Registrar turno'],['Tareas','Tareas y vencimientos'],['Reportes','Informes'],['Configuración','Respaldos JSON']].map(a=>'<button class="v2-quickbutton" data-p="'+a[0]+'">'+a[1]+' <span>↗</span></button>').join('')+
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

 let v2Section='';
 const redraw=render;
 render=function(){redraw(); if(v2Section)applySubsection(); if(page==='Inicio')document.querySelectorAll('#view [data-p]').forEach(b=>b.onclick=()=>{page=b.dataset.p;shell()});};
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
     content=template(label,'Saldos de las cuentas registradas y transferencias.',pick(fin(),[0,1]));break;
    case 'Finanzas|Ingresos':
     content=template(label,'Movimientos de ingresos registrados para el período.',pick(fin(),[0,2,3]));break;
    case 'Uber|Turno y viajes':
     content=template(label,'Registro de turnos, resultados e historial de viajes.',ub());break;
    case 'Uber|Billetera y combustible':{
     const m=metrics();
     content=template(label,'Resultado económico de Uber y acceso a la gestión de combustible y turnos.',
      '<div class="grid three">'+kpi('Neto económico',fmt(m.uber))+kpi('Horas Uber',num(m.uberHours)+' h')+kpi('Meta faltante',fmt(m.uberMissing))+'</div>'+pick(ub(),[1,2])+
      '<div class="v2-sectionlinks"><button class="btn ghost" data-v2goto="Turno y viajes">Ver historial de turnos</button><button class="btn ghost" data-v2page="Finanzas">Ver cuentas y billeteras</button></div>');break;
    }
    case 'Tareas|Tareas pendientes':
     content=template(label,'Tareas registradas, prioridades, fechas y seguimiento.',task());break;
    case 'Tareas|Calendario y vencimientos':
     content=template(label,'Agenda y vencimientos asociados a las tareas existentes.',pick(task(),[1,2,3]));break;
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
    root.innerHTML=card('Prospectos','Seguimiento comercial de oportunidades registradas.','<button class="btn" data-act="newprospect">+ Nuevo prospecto</button>'+table(['Prospecto','Estado','Detalle'],prospects.map(p=>'<tr><td>'+esc2(p.name||p.company||'Sin nombre')+'</td><td>'+esc2(p.status||'En seguimiento')+'</td><td>'+esc2(p.notes||'—')+'</td></tr>'))+(prospects.length?'':'<p>No hay prospectos registrados.</p>'));
   }else if(text.includes('cobranza')||text.includes('honorario')){
    root.innerHTML=card('Honorarios y cobranza','Estado de cobro correspondiente al período '+esc2(state.selectedMonth)+'.',table(['Cliente','Honorario','Estado','Acción'],clients.filter(c=>c.active).map(c=>{const co=collections.find(x=>x.clientId===c.id);return '<tr><td>'+esc2(c.name)+'</td><td>'+fmt(c.fee)+'</td><td><span class="v2-state '+(co?.status==='Cobrado'?'paid':'')+'">'+(co?.status==='Cobrado'?'Cobrado':'Pendiente')+'</span></td><td>'+(co?.status==='Cobrado'?'<button class="btn ghost sm" data-client="'+c.id+'">Ver ficha</button>':'<button class="btn sm" data-collect="'+c.id+'">Registrar cobro</button>')+'</td></tr>';})));
   }else if(text.includes('gestiones')){
    root.innerHTML=card('Gestiones por cliente','Accede a la ficha para revisar o registrar seguimiento.',table(['Cliente','Contacto','Ficha'],clients.filter(c=>c.active).map(c=>'<tr><td>'+esc2(c.name)+'</td><td>'+esc2(c.email||c.phone||'Sin contacto')+'</td><td><button class="btn ghost sm" data-client="'+c.id+'">Abrir ficha</button></td></tr>')));
   }else{
    root.innerHTML=card('Cartera de clientes','Clientes activos e inactivos; el honorario histórico se conserva.','<button class="btn" data-act="newclient">+ Nuevo cliente</button>'+table(['Cliente','RUT','Honorario','Día de cobro','Estado','Ficha'],clients.map(c=>'<tr><td>'+esc2(c.name)+'</td><td>'+esc2(c.rut||'—')+'</td><td>'+fmt(c.active?c.fee:0)+'</td><td>'+esc2(c.day||'—')+'</td><td><span class="v2-state '+(c.active?'paid':'')+'">'+(c.active?'Activo':'Inactivo')+'</span></td><td><button class="btn ghost sm" data-client="'+c.id+'">Abrir ficha</button></td></tr>')));
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
  const menu=[
   ['Inicio','Inicio',[['Panel general','Inicio'],['Objetivos y metas','Objetivos']]],
   ['Clientes','DEBITAR',[['Cartera y fichas','DEBITAR'],['Prospectos','DEBITAR','Prospectos'],['Honorarios y cobranza','DEBITAR','Cobranza'],['Gestiones por cliente','DEBITAR','Clientes']]],
   ['Finanzas','Finanzas',[['Flujo de caja','Finanzas'],['Bancos y cuentas','Finanzas'],['Ingresos','Finanzas'],['Gastos','Gastos'],['Deudas y cuotas','Deudas'],['Metas y presupuestos','Objetivos']]],
   ['Uber','Uber',[['Turno y viajes','Uber'],['Billetera y combustible','Uber'],['Informes','Reportes']]],
   ['Tareas y operaciones','Tareas',[['Tareas pendientes','Tareas'],['Calendario y vencimientos','Tareas']]],
   ['Reportes','Reportes',[['Informes financieros','Reportes'],['Cobranza','DEBITAR','Cobranza']]],
   ['Documentos','Documentos',[['Archivos y plantillas','Documentos']]],
   ['Configuración','Configuración',[['Parámetros','Configuración'],['Respaldos JSON','Configuración']]]
  ];
  const menuHtml=menu.map(([label,target,items])=>'<div class="v2-dropdown"><button class="v2-menuitem '+(page===target?'active':'')+'" data-v2nav="'+target+'">'+esc2(label)+' <span>⌄</span></button><div class="v2-dropcontent"><div class="v2-droptitle">'+esc2(label)+'</div><div class="v2-droplist">'+items.map(([name,p,anchor])=>'<button data-v2nav="'+p+'" '+'data-v2sub="'+esc2(name)+'"'+'><span class="v2-dropicon">↗</span><span>'+esc2(name)+'</span></button>').join('')+'</div></div></div>').join('');
  document.querySelector('#app').innerHTML='<div class="v2-hlayout"><header class="v2-hheader top"><div class="v2-hbrand"><img src="https://danielmunoz-debitar.github.io/centro-operaciones/assets/logo-debitar.png" alt="DEBITAR"><span>CENTRO DE OPERACIONES 2.0</span></div><div class="v2-hmeta"><label for="month">Período</label><input class="month" id="month" type="month" value="'+esc2(state.selectedMonth)+'"><span class="v2-avatar">D</span></div></header><nav class="v2-hnav"><button id="v2-mobile-menu" class="v2-mobile-menu">☰ Módulos</button><div class="v2-hnavitems" id="v2-hnavitems">'+menuHtml+'</div></nav><main class="v2-hmain"><div class="v2-hheading"><div><span class="v2-eyebrow">DEBITAR / '+esc2(titleFor())+'</span><h1>'+esc2(titleFor())+'</h1></div></div><div id="view"></div></main></div>';
  document.querySelectorAll('[data-v2nav]').forEach(b=>b.onclick=e=>{
   e.stopPropagation();page=b.dataset.v2nav;
   v2Section=b.dataset.v2sub||'';
   shell();
  });
  document.querySelector('#v2-mobile-menu').onclick=()=>document.querySelector('#v2-hnavitems').classList.toggle('open');
  document.querySelector('#month').onchange=e=>{state.selectedMonth=e.target.value;save();shell()};
  if(page==='Documentos'){document.querySelector('#view').innerHTML='<div class="card"><h2>Documentos</h2><p>Módulo en preparación. Los archivos actuales permanecen intactos.</p></div>';}else render();
 };
 shell();
})();
