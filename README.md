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
ENABLE_PUBLIC_REGISTRATION="true"
BOOTSTRAP_ADMIN_EMAIL=""
BOOTSTRAP_ADMIN_PASSWORD=""
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
TRANSBANK_ENVIRONMENT="integration"
TRANSBANK_COMMERCE_CODE=""
TRANSBANK_API_KEY=""
PAYMENT_MODE="full"
RESERVATION_DEPOSIT_AMOUNT="5000"
PAYMENT_HOLD_MINUTES="5"
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
- Transbank Webpay Plus confirma reservas solo tras un `commit` autorizado contra Transbank.
- `ENABLE_BOOTSTRAP_DATA` debe permanecer en `false` en produccion.
- `ENABLE_PUBLIC_REGISTRATION` permite que clientes creen cuenta desde el login; las pantallas admin siguen protegidas por rol.

## Transbank Webpay Plus

El flujo de pago usa Webpay Plus:

1. La reserva se crea como `pending_payment` y retiene el horario solo por `PAYMENT_HOLD_MINUTES`.
2. `/api/payments/transbank/create` inicia una transaccion en Webpay y devuelve `{ url, token }`.
3. El navegador hace un POST de formulario con `token_ws` a la URL de Webpay y el usuario paga.
4. Webpay redirige de vuelta a `/api/payments/transbank/commit`, que hace el `commit` contra Transbank.
5. Si la transaccion queda `AUTHORIZED` (response_code 0), la reserva pasa a `confirmed`; si no, a `payment_failed`.

A diferencia de un webhook, la confirmacion es sincrona en el retorno del navegador. La `return_url` se arma desde `NEXT_PUBLIC_APP_URL`, por lo que debe apuntar al dominio publico.

Si `PAYMENT_MODE=full`, se cobra el precio completo de la cancha. Si `PAYMENT_MODE=deposit`, se cobra el monto fijo de `RESERVATION_DEPOSIT_AMOUNT`.

Para pruebas usa `TRANSBANK_ENVIRONMENT="integration"` (con las credenciales vacias toma las llaves publicas de integracion de Transbank). Para cobros reales, define `TRANSBANK_ENVIRONMENT="production"`, `TRANSBANK_COMMERCE_CODE` y `TRANSBANK_API_KEY` con las credenciales que entrega Transbank.

## Acceso

La aplicacion esta cerrada para administradores. No publiques claves ni contrasenas en el repositorio. Si necesitas crear un admin inicial en un entorno nuevo, usa `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` como variables privadas.
