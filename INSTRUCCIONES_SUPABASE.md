# Instrucciones de Configuración de Supabase para CoupleCash

## 1. Variables de Entorno (`.env.local`)

Crea un archivo llamado `.env.local` en la raíz del proyecto con este contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

> `GEMINI_API_KEY` es solo para el servidor (escaneo de recibos en Mercado). Obtén una en [Google AI Studio](https://aistudio.google.com/apikey). No uses `NEXT_PUBLIC_` para esta clave.

---

## 2. ¿Dónde Encuentro Estas Llaves?

1. Ve a [https://supabase.com](https://supabase.com) e inicia sesión.
2. Selecciona tu proyecto (o crea uno nuevo).
3. En el menú lateral izquierdo, haz clic en **Settings** (ícono de engranaje).
4. Luego en **API**.
5. Encontrarás dos valores que necesitas:
   - **Project URL** → Copia ese valor como `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys → anon / public** → Copia ese valor como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ **NUNCA** uses la clave `service_role` en el frontend. Solo usa la clave `anon`.

---

## 3. Habilitar el Proveedor de Google en Supabase Auth

### Paso A: Obtener credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo (o usa uno existente).
3. En el menú, ve a **APIs y servicios → Credenciales**.
4. Haz clic en **+ Crear credenciales → ID de cliente de OAuth 2.0**.
5. Elige **Aplicación web**.
6. En **Orígenes de JavaScript autorizados**, agrega:
   - `http://localhost:3000` (para desarrollo)
7. En **URIs de redireccionamiento autorizados**, agrega:
   - `https://TU_PROJECT_ID.supabase.co/auth/v1/callback`
   *(Reemplaza `TU_PROJECT_ID` con el ID real de tu proyecto de Supabase)*
8. Haz clic en **Crear** y copia el **Client ID** y el **Client Secret**.

### Paso B: Configurar Google en Supabase

1. En Supabase, ve a **Authentication → Providers**.
2. Busca **Google** y habilítalo.
3. Pega el **Client ID** y **Client Secret** obtenidos de Google Cloud.
4. Guarda los cambios.

---

## 4. Configurar URLs de Redirección en Supabase

En Supabase, ve a **Authentication → URL Configuration**:

| Campo             | Valor para Desarrollo        | Valor para Producción           |
|-------------------|------------------------------|---------------------------------|
| **Site URL**      | `http://localhost:3000`      | `https://tu-dominio.com`        |
| **Redirect URLs** | `http://localhost:3000/**`   | `https://tu-dominio.com/**`     |

> 💡 El patrón `/**` permite todas las sub-rutas. Esto es necesario para que el callback de OAuth (`/auth/callback`) funcione correctamente.

---

## 5. Verificar que Todo Funcione

Una vez completados los pasos anteriores:

1. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
2. Ve a `http://localhost:3000/login`.
3. Prueba iniciar sesión con correo/contraseña (si tienes usuarios en Supabase Auth).
4. Prueba el botón "Continuar con Google".

---

## Resumen de Archivos Creados por el Agente

```
src/
├── utils/supabase/
│   ├── server.ts       → Cliente Supabase para Server Components
│   └── client.ts       → Cliente Supabase para Client Components
├── middleware.ts        → Protege rutas y refresca sesión
├── app/
│   ├── auth/callback/
│   │   └── route.ts    → Manejador del callback de OAuth (Google)
│   ├── login/
│   │   └── page.tsx    → Pantalla de Login
│   └── page.tsx        → Dashboard (ruta raíz protegida)
```
