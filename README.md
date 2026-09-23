# Alvarado Vendedores

Tablero público de progreso de venta de entradas para el evento de Alvarado.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Storage)
- **iron-session** (autenticación segura con cookies HTTP-only)
- **web-push** (Web Push / PWA notifications)
- **@dnd-kit** (drag & drop para reordenar vendedores)
- **Vercel** (hosting + cron jobs)

---

## Setup rápido

### 1. Clonar y configurar variables de entorno

```bash
cp .env.example .env.local
```

Completar `.env.local` con:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `SESSION_SECRET` | String aleatorio de al menos 32 caracteres |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave VAPID pública (ver abajo) |
| `VAPID_PRIVATE_KEY` | Clave VAPID privada |
| `VAPID_SUBJECT` | `mailto:tu@email.com` |
| `CRON_SECRET` | Secret para proteger el endpoint de cron |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |

### 2. Crear base de datos en Supabase

Ejecutar el SQL en `supabase/schema.sql` en el SQL Editor de Supabase.

En Supabase Storage, crear un bucket llamado **`photos`** con acceso público.

### 3. Generar claves VAPID

```bash
npx web-push generate-vapid-keys
```

Copiar las claves al `.env.local`.

### 4. Crear usuario admin inicial

Después de deployar (o en desarrollo), ejecutar:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "x-seed-secret: TU_CRON_SECRET"
```

Esto crea el usuario admin:
- **Usuario:** `alvakpo`
- **Contraseña:** `alvaradomdp`

### 5. Correr en desarrollo

```bash
npm run dev
```

---

## Deployment en Vercel

1. Conectar el repositorio en Vercel
2. Configurar todas las variables de entorno en Settings > Environment Variables
3. Vercel detecta automáticamente Next.js y `vercel.json` para los crons
4. El cron `/api/cron/notifications` corre cada minuto para enviar notificaciones programadas

> **Importante:** El cron de Vercel requiere plan Pro o superior para ejecutarse cada minuto.

---

## Roles y acceso

| Rol | Acceso |
|---|---|
| **Público** | Tablero de progreso (sin login) |
| **Vendedor** | Su perfil: actualizar vendidas, foto, contraseña |
| **Admin** | Todo: crear/editar vendedores, reordenar, notificaciones, cierre |

### Contraseñas iniciales
- **Admin:** `alvaradomdp` (usuario: `alvakpo`)
- **Vendedores nuevos:** `123456` (deben cambiarla)

---

## Funcionalidades

- ✅ Tablero público compacto (10+ vendedores visibles en mobile)
- ✅ Admin panel con drag & drop para reordenar
- ✅ Creación de vendedores y puntos de venta
- ✅ Historial de cambios completo
- ✅ Web Push notifications (PWA)
- ✅ Notificaciones manuales y programadas (Vercel Cron)
- ✅ Notificación automática al llegar al 100%
- ✅ Cierre de venta (congela modificaciones)
- ✅ Subida de fotos a Supabase Storage
- ✅ Passwords hasheadas con bcrypt
- ✅ Sesiones HTTP-only con iron-session
- ✅ Validaciones server-side en todos los endpoints
- ✅ PWA instalable con manifest y service worker
- ✅ Responsive (mobile-first)

---

## Estructura

```
app/
  page.tsx          # Tablero público
  login/            # Login (usuario + contraseña)
  admin/            # Panel administrador
  vendedor/         # Perfil del vendedor
  api/
    auth/           # Login / logout
    public/         # Dashboard público (sin auth)
    admin/          # Endpoints admin
    vendor/         # Perfil vendedor
    push/           # Web Push (subscribe, send, schedule)
    cron/           # Vercel cron job
    upload/         # Subida de fotos
    seed/           # Inicialización admin

components/
  admin/            # Componentes del panel admin
  NotificationButton.tsx
  ServiceWorkerRegister.tsx

lib/
  supabase.ts       # Cliente Supabase (lazy)
  session.ts        # iron-session
  webpush.ts        # Web Push (lazy)
  notifications.ts  # Broadcast a todos los suscriptores

supabase/
  schema.sql        # Schema completo de la BD
```
