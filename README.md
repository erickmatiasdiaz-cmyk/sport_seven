# Reserva Cancha - Sport Seven

Sistema web para reserva de canchas de futbol del complejo deportivo Sport Seven. Esta version usa Next.js, Prisma y Supabase PostgreSQL.

## Estado

- Proyecto Supabase: `sport-seven`
- Project ref: `odprgjtfbjsbstuciobm`
- Region: `sa-east-1`
- Tablas creadas: `users`, `courts`, `reservations`, `blocked_slots`
- Datos iniciales: 2 usuarios y 2 canchas

## Variables De Entorno

Copiar `.env.example` a `.env.local` en desarrollo, o configurar estas variables en Vercel:

```env
DATABASE_URL="postgresql://postgres.odprgjtfbjsbstuciobm:YOUR_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres.odprgjtfbjsbstuciobm:YOUR_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?schema=public"
AUTH_SECRET="change-this-to-a-random-string-with-at-least-32-characters"
ENABLE_BOOTSTRAP_DEMO_DATA="false"
```

`YOUR_PASSWORD` es la password de base de datos del proyecto Supabase. `AUTH_SECRET` debe ser un valor privado y largo.

## Credenciales Iniciales

Estas credenciales son solo para la primera entrada. Cambiarlas antes de entregar el sistema a un cliente.

```txt
Admin: admin@sportseven.cl / admin123
Usuario demo: usuario@sportseven.cl / user123
```

## Desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Produccion

```bash
npm run build
npm start
```

El script `build` ejecuta:

```bash
prisma generate && prisma migrate deploy && next build
```

## Funcionalidades

- Registro e inicio de sesion con cookie httpOnly firmada.
- Vista cliente para ver canchas activas, horarios disponibles y crear reservas.
- Vista de "Mis reservas" con cancelacion solo para reservas propias.
- Panel admin para ver reservas del sistema, crear reservas manuales, bloquear horarios y administrar canchas.
- Validacion server-side de fecha, horario, duracion permitida, cancha activa y solapes.
- Bloqueo transaccional por cancha/fecha para reducir carreras de doble reserva.

## Seguridad

- El servidor ya no confia en `userId`, `userRole`, query params ni headers enviados desde el cliente.
- Las rutas admin usan la sesion firmada para autorizar.
- Las cookies de sesion son `httpOnly`, `sameSite=lax` y `secure` en produccion.
- `ENABLE_BOOTSTRAP_DEMO_DATA` debe permanecer en `false` en produccion.

## Reglas Del Sistema

- No se permiten reservas solapadas.
- Duraciones soportadas: 60 y 90 minutos, segun configuracion de cada cancha.
- Los horarios se validan contra apertura/cierre de la cancha.
- Estados: `pending`, `confirmed`, `cancelled`.
