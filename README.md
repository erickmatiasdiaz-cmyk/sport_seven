# Reserva Cancha - Sport Seven

Sistema de reserva de canchas de fútbol con apariencia de aplicación móvil para el complejo deportivo **Sport Seven**.

## Identidad Visual

### Paleta de Colores Sport Seven

- **Primary (Azul Turquesa):** `#1FA3C8` - Headers y elementos principales
- **Secondary (Naranja):** `#F7931E` - Botones principales (Reservar, Confirmar)
- **Accent (Amarillo):** `#FFD24A` - Acentos decorativos
- **Background:** `#F6F8FA` - Fondo de la aplicación

### Estados de Reserva

- **Confirmada:** Verde `#22c55e`
- **Pendiente:** Amarillo `#eab308`
- **Cancelada:** Rojo `#ef4444`

## Tecnologías

- **Frontend:** Next.js 14+, TypeScript, TailwindCSS, App Router
- **Backend:** Next.js Route Handlers
- **Base de datos:** PostgreSQL
- **ORM:** Prisma

## Funcionalidades

### Cliente
- Ver canchas disponibles
- Reservar por fecha y horario
- Ver y cancelar reservas propias

### Admin Panel (`/admin`)
- Ver todas las reservas por día
- Crear reserva manual
- Cancelar reserva
- Bloquear/desbloquear horarios

## Ejecución

```bash
# Instalar dependencias
npm install

# Configurar variable de entorno
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"

# Ejecutar migraciones de Prisma
npx prisma migrate deploy

# Cargar datos iniciales (2 canchas de fútbol)
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Despliegue en Vercel

1. Crear una base de datos PostgreSQL remota en Vercel Postgres, Neon o Supabase.
2. Agregar `DATABASE_URL` en `Project Settings > Environment Variables`.
3. Volver a desplegar. El build ejecuta automáticamente:

```bash
prisma generate && prisma migrate deploy && next build
```

## Estructura

```
app/
  page.tsx                 # Home - lista de canchas
  reservar/
    page.tsx               # Página de reserva
  mis-reservas/
    page.tsx               # Mis reservas
  admin/
    page.tsx               # Panel admin
  api/
    courts/route.ts        # API canchas
    reservations/route.ts  # API reservas
    availability/route.ts  # API disponibilidad
    blocked-slots/route.ts # API bloqueos
components/
  court-card.tsx
  reservation-form.tsx
  availability-calendar.tsx
  bottom-nav.tsx
lib/
  prisma.ts
  availability.ts
prisma/
  schema.prisma
  seed.ts
```

## Reglas del Sistema

- No se permiten dobles reservas
- Bloques de 60 minutos
- Horario: 18:00 a 23:00
- Estados: pending, confirmed, cancelled
