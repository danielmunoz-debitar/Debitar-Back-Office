# Revisión de estabilización 2.0.10

Base: `450c30f` (main ya identifica los recursos como 2.0.9). Cambios limitados a `v2/`.

## Correcciones

- Menús desplegables con apertura explícita mediante clic/toque y estado accesible. Los accesos heredados limpian el submenú anterior.
- Las vistas especializadas respetan el bloqueo de períodos cerrados o sin abrir.
- Finanzas, Uber y Tareas dejan de extraer componentes por posición DOM: conservan el módulo completo y sus controles en los submenús. Temporalmente comparten contenido hasta separar componentes por responsabilidad.
- Cartera y fichas recupera el módulo existente, activación/desactivación, agenda y controles comerciales; agrega búsqueda por nombre, RUT, correo y teléfono.
- Gestiones por cliente abre el control mensual existente. Prospectos recupera el acceso a edición.
- Ficha: nombre obligatorio, honorario no negativo, día 1–31, formato de correo y detección de RUT duplicado normalizando puntos/guion. No se valida dígito verificador en esta etapa. Edita una copia hasta completar el guardado; conserva campos adicionales y bóveda. En inactivos actualiza honorario histórico sin activar cobros.
- Caché con espacio exclusivo `debitar-v2-*`, recursos precargados con sus URLs versionadas y logo local existente. Sólo GET del ámbito v2 y logo; no almacena respuestas HTTP fallidas. Elimina exclusivamente sus propias cachés nuevas.
- Se conserva la clave `debitar_ops_v2`, el importador/migración y el esquema existente.

## Verificación realizada

`node --check` para los scripts modificados y `git diff --check`.

`NODE_PATH=/tmp/debitar-qa/node_modules node v2/tests/review.cjs` con jsdom instalado fuera del repositorio:

- Apertura/cierre de ocho menús y recorrido de 22 submenús sin errores JavaScript.
- Presencia de controles de conciliación, ingresos, tareas, seguimiento, activación y control mensual.
- Búsqueda, navegación desde Dashboard y limpieza de submenú.
- Importación de JSON de prueba, persistencia de ficha, rechazo de entradas inválidas y RUT duplicado.
- Bloqueo de período cerrado y aislamiento de almacenamiento mediante clave testigo.
- Simulación del service worker: precarga con archivos existentes, aislamiento de borrado, exclusión de POST/raíz, rechazo de caché para errores HTTP y recuperación offline.

## Límites y pendientes

- Pruebas DOM y simulación de caché; no equivalen a validación visual ni offline real. El navegador Chromium no estuvo disponible y su descarga falló. Antes de publicar: revisar escritorio/móvil, zoom y efectos, teclado y recarga offline en navegador real.
- Documentos sigue siendo el módulo en preparación que ya existía.
- El service worker original sigue pudiendo borrar cachés ajenas cuando se active una futura actualización original. No se modifica por la restricción de mantener la aplicación raíz intacta.
- Persisten migraciones heredadas que inicializan clientes y saldos de ejemplo. No se reescribieron ni se conectó esta prueba a registros del usuario.
- No se han revisado todos los cálculos financieros ni todas las variantes históricas de respaldos JSON. La compatibilidad se conserva por no cambiar su importador ni esquema.
- No se accedió a los registros locales del navegador del usuario. Los tests usan datos aislados.
