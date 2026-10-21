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
   '</div><p class="muted">Los indicadores se calculan con la lógica financiera heredada. Revisaremos su conciliación antes de una migración definitiva.</p></div></div>';
 };
 const redraw=render;
 render=function(){redraw(); if(page==='Inicio')document.querySelectorAll('#view [data-p]').forEach(b=>b.onclick=()=>{page=b.dataset.p;shell()});};
 function titleFor(){return mainPage(page)}
 function v2nav(){return NAV.map(([label,ico,target])=>'<button class="v2-navitem '+(page===target?'active':'')+'" data-v2nav="'+target+'"><span class="v2-icon">'+ico+'</span><span>'+label+'</span></button>').join('')}
 shell=function(){
  document.querySelector('#app').innerHTML='<div class="v2-layout"><aside class="v2-sidebar" id="v2-sidebar"><div class="v2-brand"><img src="https://danielmunoz-debitar.github.io/centro-operaciones/assets/logo-debitar.png" alt="DEBITAR"><small>CENTRO DE OPERACIONES 2.0</small></div><div class="v2-navlabel">MÓDULOS</div><nav class="v2-navigation">'+v2nav()+'</nav><div class="v2-sidefoot">Versión 2.0 · Entorno independiente</div></aside><div class="v2-main"><header class="v2-top"><button class="v2-menu" id="v2-toggle" aria-label="Abrir menú">☰</button><div class="v2-topname"><b>'+esc2(titleFor())+'</b><small>DEBITAR · Gestión integral</small></div><div class="v2-topright"><label for="month">Período</label><input class="month" id="month" type="month" value="'+esc2(state.selectedMonth)+'"><span class="v2-avatar">D</span></div></header><div class="v2-content"><div class="v2-subhead"><div><span class="v2-eyebrow">DEBITAR / '+esc2(titleFor())+'</span><h1>'+esc2(titleFor())+'</h1></div><div class="v2-submenu">'+(page==='DEBITAR'?'<button data-v2jump="clientes">Clientes</button><button data-v2jump="prospectos">Prospectos</button><button data-v2jump="cobranza">Cobranza</button>':'')+'</div></div><div id="view"></div></div></div></div>';
  document.querySelectorAll('[data-v2nav]').forEach(b=>b.onclick=()=>{const p=b.dataset.v2nav;if(p==='Documentos'){page='Documentos';document.querySelector('#view').innerHTML='<div class="card"><h2>Documentos</h2><p>Módulo previsto para una etapa posterior. No se han alterado los archivos actuales.</p></div>';shell();return;}page=p;shell();});
  document.querySelector('#v2-toggle').onclick=()=>document.querySelector('#v2-sidebar').classList.toggle('v2-open');
  document.querySelector('#month').onchange=e=>{state.selectedMonth=e.target.value;save();shell()};
  if(page==='Documentos'){document.querySelector('#view').innerHTML='<div class="card"><h2>Documentos</h2><p>Próximamente: plantillas, archivos por cliente e informes.</p></div>';}
  else render();
  document.querySelectorAll('[data-v2jump]').forEach(b=>b.onclick=()=>{const text=b.dataset.v2jump==='clientes'?'Clientes':b.dataset.v2jump==='prospectos'?'Prospectos':'Cobranza';const h=[...document.querySelectorAll('#view h1,#view h2,#view h3')].find(x=>x.textContent.toLowerCase().includes(text.toLowerCase()));h?.scrollIntoView({behavior:'smooth',block:'start'});});
 };
 shell();
})();
