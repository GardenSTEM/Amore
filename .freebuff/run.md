# Amorebox — Guía de ejecución (run doc)

Proyecto estático (HTML/CSS/JS vanilla) conectado a Supabase.
No requiere instalación de dependencias: el servidor de vista previa es Node puro.

## Cómo reproducir los artefactos

No hay pasos de compilación. Para un checkout fresco solo se necesita:

1. Node.js ≥ 18 (`node --version`).
2. Copiar `.env.example` a `.env` y completar las credenciales de Supabase y Cloudinary.
   Usa la clave `anon`/publicable de Supabase (nunca `service_role`) y conserva `CLOUDINARY_API_SECRET` solo en el servidor.

Archivos clave:
- `preview-server.js` — servidor estático (Node puro, sin dependencias).
- `package.json` — define el script `dev`.
- `.env` — credenciales locales, ignoradas por Git. El servidor las entrega a la página mediante `/supabase-config.js`; la anon key sigue siendo visible en el navegador y la seguridad depende de las políticas RLS.
- `CLOUDINARY_API_SECRET` — solo lo lee Node para firmar las subidas. Nunca se envía al navegador.
- `js/supabase-config.js` — crea los clientes de Supabase a partir de la configuración entregada por el servidor. Sin credenciales, avisa por consola.
- Base de datos: ejecutar `supabase/schema.sql` y `supabase/seed.sql` en el SQL Editor de Supabase; usuario admin en Authentication → Users con "Auto Confirm User" (paso a paso en `GUÍA-SUPABASE.txt`).
- Imágenes: el panel admin sube a Cloudinary a través de `/api/cloudinary-upload`; requiere un hosting Node. Cloudinary entrega URLs optimizadas (`f_auto,q_auto,w_900,c_limit`) que se guardan en `productos.imagen_url`.

## Migrar las imágenes existentes

Con el `.env` completo y la base de datos actual accesible:

```bash
npm run migrate:cloudinary
```

El comando sube las fotos del seed a Cloudinary; si un archivo falta localmente, intenta descargarlo desde la URL guardada en Supabase o desde el bucket público `productos`. También migra imágenes de otros productos y actualiza `supabase/seed.sql`. En el SQL Editor de Supabase, ejecuta primero el seed actualizado para insertar los productos que falten (los existentes no se modifican por `ON CONFLICT DO NOTHING`) y luego `supabase/cloudinary-migration.sql` para actualizar sus URLs.

El endpoint de subida valida la sesión de Supabase y acepta JPG, PNG y WebP de hasta 10 MB. Configura en el hosting Node las mismas variables del `.env`; nunca publiques `CLOUDINARY_API_SECRET`.

## Cómo correr el servidor

```bash
npm run dev
```

- Sirve la raíz del proyecto en **http://127.0.0.1:3001** (puerto 3001; configurable con la variable `PORT`; en hosting Node escucha en `0.0.0.0`).
- Para lanzarlo desvinculado en Windows (receta de la plataforma):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

- Confirmar que sigue vivo: `powershell -NoProfile -Command "Get-Process -Id <pid>"`.
- Verificar que responde antes de registrar la vista previa: `curl http://127.0.0.1:3001/index.html`.

Rutas principales:
- `/index.html` — página pública ("Lo más vendido" dinámico desde Supabase)
- `/catalogo%20arreglos.html`, `/catalogo%20carteras.html` — catálogos dinámicos (tiempo real)
- `/admin/admin.html` — panel de administración; login con el usuario creado en Supabase Authentication
