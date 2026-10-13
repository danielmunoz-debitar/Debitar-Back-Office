# DEBITAR Centro de Operaciones v1.0.9 — consolidación de cambios

Incluye la funcionalidad previa de v1.0.8 y agrega:
- Cartera: Constructora Aviva e Inversiones Rivera activos a $50.000 cada uno, día 25; Botillería Patricio Jara inactivo en rojo con monto vigente $0. Conserva honorarios históricos. No genera cobros de septiembre ni ingresos nuevos.
- Activar/desactivar clientes con confirmación y filtros activos/inactivos/todos.
- Billetera Efectivo creada con $11.000 declarados (registro de conciliación inicial auditable, no ingreso). No altera otras cuentas ni inventa transferencias.
- Agenda comercial compacta de 2 días habilitados con botón de semana completa y configuración existente; mantiene reserva de bloques.
- Auditoría rápida desde Inicio: botones de desglose de billeteras, cartera, cobros, ingresos, gastos, pagos, pendientes, Uber y horas; exportación CSV compatible con Excel. No es exportación XLSX nativa.
- Seguimiento de clientes dentro de Tareas de v1.0.8.

**Importante:** la actualización no corrige automáticamente discrepancias de cuentas bancarias ni presupone el importe desconocido transferido de Falabella a Banco de Chile. Requiere conciliación verificable. El desglose de indicadores se añade como panel de auditoría, no haciendo clic directamente sobre todos los KPI existentes. La exportación es CSV compatible con Excel, no archivo XLSX. La meta Uber y la edición retrospectiva de turnos no se modifican en este paquete.

Antes de instalar: exportar respaldo JSON actualizado. Reemplazar archivos en GitHub Pages y recargar. No importar backups antiguos sobre datos más recientes.
