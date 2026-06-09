# Despliegue en Vercel

## Base de datos

La app usa PostgreSQL en Supabase. Configura `DATABASE_URL` con la connection string privada del proyecto.

## Variables requeridas

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@db.krxawudnypjazsqwswel.supabase.co:5432/postgres?schema=public"
AUTH_SECRET="un-secreto-largo-y-aleatorio"
ENABLE_BOOTSTRAP_DATA="false"
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="public-key"
MERCADOPAGO_ACCESS_TOKEN="token-privado"
MERCADOPAGO_WEBHOOK_SECRET="secreto-webhook"
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

## Mercado Pago

Configura en Mercado Pago Developers el webhook:

```txt
https://tu-dominio.vercel.app/api/payments/mercadopago/webhook
```

Activa notificaciones de pagos. En produccion, `MERCADOPAGO_WEBHOOK_SECRET` debe estar configurado para validar la firma.

## Admin inicial

La aplicacion esta cerrada para administradores. Si necesitas crear un admin inicial en un entorno nuevo, usa variables privadas:

```bash
ENABLE_BOOTSTRAP_DATA="true"
BOOTSTRAP_ADMIN_EMAIL="admin@tu-dominio.cl"
BOOTSTRAP_ADMIN_PASSWORD="contrasena-segura"
```

Despues del primer inicio, vuelve a dejar `ENABLE_BOOTSTRAP_DATA="false"`.
