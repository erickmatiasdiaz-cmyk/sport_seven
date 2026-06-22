# Despliegue en Vercel

## Base de datos

La app usa PostgreSQL en Supabase. Configura `DATABASE_URL` con la connection string privada del proyecto.

## Variables requeridas

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@db.krxawudnypjazsqwswel.supabase.co:5432/postgres?schema=public"
AUTH_SECRET="un-secreto-largo-y-aleatorio"
ENABLE_BOOTSTRAP_DATA="false"
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
TRANSBANK_ENVIRONMENT="production"
TRANSBANK_COMMERCE_CODE="codigo-comercio-webpay"
TRANSBANK_API_KEY="api-key-secret-webpay"
PAYMENT_MODE="full"
RESERVATION_DEPOSIT_AMOUNT="5000"
```

No publiques tokens ni contrasenas en GitHub.

## Prisma

El build de produccion ejecuta:

```bash
prisma generate && next build
```

Las migraciones se aplican fuera del build para evitar que cada deploy modifique la base.

## Transbank Webpay Plus

No requiere webhook: Webpay confirma en el retorno del navegador a
`/api/payments/transbank/commit`. Para cobros reales define en Vercel:

```txt
TRANSBANK_ENVIRONMENT="production"
TRANSBANK_COMMERCE_CODE="<codigo de comercio Webpay Plus>"
TRANSBANK_API_KEY="<api key secret de Webpay Plus>"
```

`NEXT_PUBLIC_APP_URL` debe ser el dominio publico, porque la `return_url` que
recibe Transbank se construye a partir de esa variable.

## Admin inicial

La aplicacion esta cerrada para administradores. Si necesitas crear un admin inicial en un entorno nuevo, usa variables privadas:

```bash
ENABLE_BOOTSTRAP_DATA="true"
BOOTSTRAP_ADMIN_EMAIL="admin@tu-dominio.cl"
BOOTSTRAP_ADMIN_PASSWORD="contrasena-segura"
```

Despues del primer inicio, vuelve a dejar `ENABLE_BOOTSTRAP_DATA="false"`.
