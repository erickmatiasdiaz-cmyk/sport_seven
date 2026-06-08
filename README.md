# Reserva Cancha - Sport Seven

Sistema de reserva de canchas de futbol para el complejo deportivo Sport Seven.

## Tecnologias

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL en Supabase

## Variables de entorno

El proyecto esta conectado al proyecto Supabase `sport_seven`:

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@db.krxawudnypjazsqwswel.supabase.co:5432/postgres?schema=public"
AUTH_SECRET="un-secreto-largo-y-aleatorio"
ENABLE_BOOTSTRAP_DATA="false"
BOOTSTRAP_ADMIN_EMAIL=""
BOOTSTRAP_ADMIN_PASSWORD=""
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
MERCADOPAGO_ACCESS_TOKEN="APP_USR-o-TEST-token"
MERCADOPAGO_WEBHOOK_SECRET="clave-secreta-webhook"
PAYMENT_MODE="full"
RESERVATION_DEPOSIT_AMOUNT="5000"
PAYMENT_HOLD_MINUTES="15"
```

Reemplaza `PASSWORD` por la contrasena real de la base de datos de Supabase.

## Ejecucion local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Verificacion

```bash
npm run lint
npm run build
npm audit --audit-level=moderate
```

## Base de datos

Las migraciones fueron aplicadas en Supabase con el conector de Supabase. El build no ejecuta `prisma migrate deploy`; solo corre:

```bash
prisma generate && next build
```

Para nuevos entornos, aplica las migraciones Prisma antes de iniciar la app:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Seguridad

- La sesion se valida en servidor con cookie HTTP-only firmada.
- Las APIs ya no aceptan `userId`, `userRole` ni `x-user-role` desde el cliente como autorizacion.
- Supabase tiene RLS habilitado y politicas deny-all para la Data API.
- La base bloquea reservas solapadas por cancha, fecha y horario.
- Mercado Pago Checkout Pro confirma reservas solo cuando el webhook informa pago aprobado.
- `ENABLE_BOOTSTRAP_DATA` debe permanecer en `false` en produccion.

## Mercado Pago

El flujo de pago usa Checkout Pro:

1. La reserva se crea como `pending_payment` y retiene el horario solo por `PAYMENT_HOLD_MINUTES`.
2. Se crea una preferencia de Mercado Pago.
3. El usuario paga en Mercado Pago.
4. El webhook `/api/payments/mercadopago/webhook` consulta el pago en Mercado Pago.
5. Si el pago esta `approved`, la reserva pasa a `confirmed`.

Configura en Mercado Pago Developers el webhook productivo:

```txt
https://tu-dominio.vercel.app/api/payments/mercadopago/webhook
```

Si `PAYMENT_MODE=full`, se cobra el precio completo de la cancha. Si `PAYMENT_MODE=deposit`, se cobra el monto fijo de `RESERVATION_DEPOSIT_AMOUNT`.

## Acceso

La aplicacion esta cerrada para administradores. No publiques claves ni contrasenas en el repositorio. Si necesitas crear un admin inicial en un entorno nuevo, usa `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` como variables privadas.
