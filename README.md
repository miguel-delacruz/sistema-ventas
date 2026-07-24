# Sistema de ventas — POPEY GROUP

Aplicación web académica para registrar y consultar ventas. Utiliza Supabase para autenticación y PostgreSQL, Vercel para hosting y funciones serverless, Vitest para pruebas y OWASP ZAP para análisis dinámico.

## Funciones

- Inicio y cierre de sesión real.
- Acceso protegido mediante Supabase Auth y Row Level Security.
- Registro persistente de ventas.
- Dashboard y reportes calculados desde PostgreSQL.
- Endpoint de salud en `/api/health`.
- Logs JSON en Vercel.
- Backup diario mediante Vercel Cron.
- Pruebas unitarias, auditoría de dependencias y OWASP ZAP.
- Libro de Reclamaciones público con numeración correlativa, constancia imprimible y copia por correo.

## Desarrollo local

Requisitos: Node.js 22 y npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Completar en `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

La migración de base de datos se encuentra en `supabase/migrations/001_create_sales.sql`.

## Pruebas

```bash
npm test
npm run test:coverage
npm run build
npm audit --audit-level=high
```

GitHub Actions ejecuta pruebas, build y auditoría en cada push y pull request. El flujo **OWASP ZAP** se ejecuta manualmente desde Actions indicando la URL desplegada.

## Despliegue GitHub → Vercel

1. Crear un repositorio en GitHub y subir este proyecto.
2. En Vercel, seleccionar **Add New Project** e importar el repositorio.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Configurar las variables:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
VITE_PROVIDER_LEGAL_NAME=
VITE_PROVIDER_RUC=
VITE_PROVIDER_ADDRESS=
VITE_PROVIDER_CONTACT_EMAIL=
RESEND_API_KEY=
RECLAMACIONES_FROM_EMAIL=
```

`SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` son secretos: nunca deben estar en GitHub ni en variables que comiencen con `VITE_`.

`RESEND_API_KEY` también es secreta. Las variables `VITE_PROVIDER_*` son públicas porque identifican al proveedor en la Hoja de Reclamación.

Cada push crea un despliegue; `main` se utiliza para producción.

## Monitoreo

- `/api/health`: estado de aplicación y conexión a PostgreSQL.
- Vercel **Logs**: eventos `health_check`, `backup_completed` y errores.
- Vercel **Observability**: invocaciones, duración y tasa de error.
- Vercel **Speed Insights**: métricas web; se habilita desde el panel del proyecto.

El endpoint de salud no devuelve credenciales ni detalles internos de los errores.

## Backup y restauración

`vercel.json` ejecuta `/api/backup` diariamente a las 05:00 UTC. La función exige `CRON_SECRET`, exporta la tabla `ventas` a un bucket privado `backups` y conserva los siete archivos más recientes.

Backup manual:

```bash
npm run backup
```

Restauración:

```bash
npm run restore -- backups/ventas-fecha.json
```

Los scripts administrativos requieren `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno.

## Libro de Reclamaciones

El formulario público está disponible en `/reclamaciones.html` y no requiere autenticación. La tabla se crea ejecutando `supabase/migrations/002_create_complaints.sql`.

El formulario:

- diferencia reclamos relacionados con productos/servicios de quejas sobre atención;
- solicita los datos mínimos de identificación, contacto, operación, detalle y pedido;
- registra fecha, hora, conformidad y numeración correlativa;
- permite imprimir o guardar la constancia;
- envía automáticamente una copia mediante Resend cuando `RESEND_API_KEY` y `RECLAMACIONES_FROM_EMAIL` están configuradas;
- conserva los registros en PostgreSQL y los incluye en el backup diario.

La razón social, RUC y dirección deben corresponder al proveedor real. Las reclamaciones deben responderse en un máximo improrrogable de 15 días hábiles y conservarse al menos dos años.

Los datos de POPEY GROUP SRL incluidos por defecto son ficticios y están señalados como demostración. Antes de utilizar el sistema comercialmente deben sustituirse por datos reales y configurarse un remitente de correo verificado.

## Evidencias recomendadas

- Captura de GitHub Actions en verde.
- Resultado de `npm test` y cobertura.
- Reporte de OWASP ZAP.
- Respuesta de `/api/health`.
- Logs de Vercel.
- Ejecución del cron y archivo generado en Supabase Storage.
- Dashboard con una venta persistente después de recargar.
