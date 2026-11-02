-- =============================================================
--  AMOREBOX · SISTEMA DE INVENTARIO Y CATÁLOGO
--  Script de esquema para Supabase (PostgreSQL)
--  Ejecutar completo en el SQL Editor de Supabase
-- =============================================================

-- 1) TIPO DE CATEGORÍA (a nivel de BD: solo 'cartera' o 'arreglo')
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_producto') THEN
        CREATE TYPE categoria_producto AS ENUM ('cartera', 'arreglo');
    END IF;
END $$;

-- 2) TABLA CENTRALIZADA DE PRODUCTOS
--    Una sola tabla con columna discriminante `categoria`: es la mejor práctica
--    aquí porque ambos tipos comparten exactamente los mismos atributos.
CREATE TABLE IF NOT EXISTS public.productos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria      categoria_producto NOT NULL,
    nombre         TEXT NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 1 AND 120),
    descripcion    TEXT NOT NULL DEFAULT '',
    marca          TEXT,
    precio         NUMERIC(10,2) CHECK (precio IS NULL OR precio >= 0),
    imagen_url     TEXT NOT NULL DEFAULT '',
    stock          INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    destacado      BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.productos IS 'Catálogo de carteras y arreglos florales de Amorebox';

-- 3) ÍNDICES
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_nombre    ON public.productos USING gin (to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_precio    ON public.productos (precio);
CREATE INDEX IF NOT EXISTS idx_productos_marca     ON public.productos (marca);
-- Evita productos duplicados (mismo nombre dentro de la misma categoría)
CREATE UNIQUE INDEX IF NOT EXISTS uq_productos_categoria_nombre ON public.productos (categoria, lower(nombre));

-- 4) updated_at AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON public.productos;
CREATE TRIGGER trg_productos_updated_at
    BEFORE UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) ROW LEVEL SECURITY
--    Lectura pública del catálogo (página de clientes).
--    Escritura (INSERT/UPDATE/DELETE) solo para usuarios autenticados (panel /admin).
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Catalogo publico de lectura" ON public.productos;
CREATE POLICY "Catalogo publico de lectura"
    ON public.productos FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Escritura solo para autenticados" ON public.productos;
CREATE POLICY "Escritura solo para autenticados"
    ON public.productos FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizacion solo para autenticados" ON public.productos;
CREATE POLICY "Actualizacion solo para autenticados"
    ON public.productos FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Borrado solo para autenticados" ON public.productos;
CREATE POLICY "Borrado solo para autenticados"
    ON public.productos FOR DELETE
    TO authenticated
    USING (true);

-- 6) REALTIME (el catálogo se refresca solo cuando el admin cambia algo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'productos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
    END IF;
END $$;

-- 7) STORAGE: bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagenes de productos lectura publica" ON storage.objects;
CREATE POLICY "Imagenes de productos lectura publica"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Imagenes de productos escritura autenticada" ON storage.objects;
CREATE POLICY "Imagenes de productos escritura autenticada"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'productos');

DROP POLICY IF EXISTS "Imagenes de productos actualizacion autenticada" ON storage.objects;
CREATE POLICY "Imagenes de productos actualizacion autenticada"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'productos')
    WITH CHECK (bucket_id = 'productos');

DROP POLICY IF EXISTS "Imagenes de productos borrado autenticado" ON storage.objects;
CREATE POLICY "Imagenes de productos borrado autenticado"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'productos');

-- 8) LISTO.
--    Nota: la URL pública de cada imagen la escribe el panel de administración
--    (js/supabase-api.js) con supabase.storage.from('productos').getPublicUrl(),
--    que es el método oficial y siempre genera la URL correcta de tu proyecto.
