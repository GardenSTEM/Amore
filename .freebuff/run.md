# Amorebox — Guía de ejecución (run doc)

Proyecto estático (HTML/CSS/JS vanilla) conectado a Supabase.
No requiere instalación de dependencias: el servidor de vista previa es Node puro.

## Cómo reproducir los artefactos

No hay pasos de compilación. Para un checkout fresco solo se necesita:

1. Node.js ≥ 18 (`node --version`).
2. Copiar `.env.example` a `.env` y completar `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
   Usa la URL del proyecto y la clave `anon`/publicable; nunca uses `service_role`.

Archivos clave:
- `preview-server.js` — servidor estático (Node puro, sin dependencias).
- `package.json` — define el script `dev`.
- `.env` — credenciales locales, ignoradas por Git. El servidor las entrega a la página mediante `/supabase-config.js`; la anon key sigue siendo visible en el navegador y la seguridad depende de las políticas RLS.
- `js/supabase-config.js` — crea los clientes de Supabase a partir de la configuración entregada por el servidor. Sin credenciales, avisa por consola.
- Base de datos: ejecutar `supabase/schema.sql` y `supabase/seed.sql` en el SQL Editor de Supabase; usuario admin en Authentication → Users con "Auto Confirm User" (paso a paso en `GUÍA-SUPABASE.txt`).
- Imágenes: viven en Supabase Storage (bucket `productos`), migradas con `migrar-imagenes.mjs` / `MIGRAR-IMAGENES.bat` (PASO 6B de la guía). Los productos nuevos suben su foto desde el panel admin.

## Cómo correr el servidor

```bash
npm run dev
```

- Sirve la raíz del proyecto en **http://127.0.0.1:3001** (puerto 3001; configurable con la variable `PORT`).
- Para lanzarlo desvinculado en Windows (receta de la plataforma):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

- Confirmar que sigue vivo: `powershell -NoProfile -Command "Get-Process -Id <pid>"`.
- Verificar que responde antes de registrar la vista previa: `curl http://127.0.0.1:3000/index.html`.

Rutas principales:
- `/index.html` — página pública ("Lo más vendido" dinámico desde Supabase)
- `/catalogo%20arreglos.html`, `/catalogo%20carteras.html` — catálogos dinámicos (tiempo real)
- `/admin/admin.html` — panel de administración; login con el usuario creado en Supabase Authentication
