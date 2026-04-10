# Despliegue en Vercel

## Base de datos

SQLite no funciona bien en Vercel para este proyecto. La app debe usar PostgreSQL con `DATABASE_URL`.

### Opción 1: Neon
1. Crear un proyecto en https://neon.tech
2. Copiar la connection string de PostgreSQL
3. Agregarla en Vercel > Project Settings > Environment Variables como `DATABASE_URL`

### Opción 2: Supabase
1. Crear un proyecto en https://supabase.com
2. Ir a Project Settings > Database
3. Copiar la connection string
4. Agregarla en Vercel como `DATABASE_URL`

## Prisma

El repositorio ya quedó preparado para producción con:

- `provider = "postgresql"` en `prisma/schema.prisma`
- migraciones versionadas en `prisma/migrations`
- build de producción: `prisma generate && prisma migrate deploy && next build`

## Pasos

1. Hacer push a GitHub
2. Importar el repositorio en Vercel
3. Configurar `DATABASE_URL`
4. Ejecutar el primer deploy

## Datos iniciales

La app crea datos base si la base está vacía:

- admin: `admin@sportseven.cl` / `admin123`
- usuario: `usuario@sportseven.cl` / `user123`
- 2 canchas iniciales

También se puede correr el seed manualmente si hace falta:

```bash
npx prisma db seed
```
