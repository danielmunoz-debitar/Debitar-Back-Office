DEBITAR · Centro de Operaciones v1.0.1

Añade Director de Tiempo DEBITAR: clasificación Producción / Comercial / Gestión / Mejora, cliente asociado, recomendación de próximo bloque y distribución 40/30/20/10.

DEBITAR · Centro de Operaciones v0.9 COMERCIAL

QR/Calculadora → WhatsApp → Pipeline → Google Calendar → Propuesta → Cliente.

# DEBITAR · Centro de Operaciones v0.8 DAILY

Construida de forma incremental sobre la v0.6.1 SAFE / v0.5 funcional.

## Cambios v0.7
- Meta Uber dinámica: gastos/obligaciones menos trabajo dependiente, otros ingresos y cartera DEBITAR esperada; Uber acumulado reduce el faltante.
- Tareas con fecha de inicio, días asignados, días corridos/hábiles, fecha límite automática y alerta roja en el menú.
- Cuentas por cobrar personales/externas dentro de Finanzas. Sólo pasan a Otros ingresos y billetera cuando se cobran.
- Proyectos ampliados: inversión, implementos, cotizaciones, trámites, horas, días de puesta en marcha, MVP, escenario base/adverso, riesgo y payback.
- Nuevo gasto con opción inmediata “Este gasto ya está pagado”, seleccionando billetera y fecha.
- Barra lateral derecha más compacta: se eliminó el texto DEBITAR redundante; el logo se mantiene a la izquierda.
- Compatibilidad con respaldos anteriores mediante migración conservadora.

## Publicación
Reemplaza index.html, app.js, styles.css, manifest.webmanifest, sw.js y assets en el repositorio. Conserva un respaldo JSON antes de actualizar.

# v1.0 · 06-10-2026
- Ficha comercial-operativa por cliente: plan, mensualidad base, herramientas adicionales y ticket mensual.
- Control mensual por cliente con checklist derivado del plan y tareas específicas editables.
- Hito interno configurable (por defecto día 10) para detectar información mensual no enviada; no representa vencimiento legal.
- Resumen mensual del cliente con Previred, honorarios, F29, total, observaciones y bloque Valor DEBITAR editable/omitible.
- Sugerencias automáticas de variación mensual y cross-selling según herramientas no contratadas.
- Vista imprimible profesional para Guardar como PDF desde el navegador e historial mensual en localStorage.
- Fondo de emergencia Dic-26 a Jun-27 con meta vs real y semáforo 95% / 80%.
- Proyección configurable: ahorro base, liberación de hogar y Operación Renta; proyección separada del ahorro real.
- Service Worker actualizado para evitar caché antigua.
