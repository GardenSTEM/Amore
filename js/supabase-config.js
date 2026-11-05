// =============================================================
//  AMOREBOX · CONFIGURACIÓN DE SUPABASE
//  ------------------------------------------------------------
//  La vista previa local entrega estas credenciales desde .env mediante
//  /supabase-config.js. La anon key es pública y también será visible en el navegador.
// =============================================================

const SUPABASE_CONFIG = window.AMOREBOX_SUPABASE_CONFIG || {};
const SUPABASE_URL = SUPABASE_CONFIG.url || '';
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey || '';

// Normalización defensiva: si algún día se pega la URL con sufijo
// /rest/v1 (viene así en el ejemplo de la API) o con espacios, se
// corrige sola para que el login nunca falle por eso.
const SUPABASE_URL_LIMPIA = SUPABASE_URL.trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1.*$/, '')
    // Corrige el error más común: escribir .supabase.com en lugar de .supabase.co
    .replace(/\.supabase\.com(?=$|\/)/i, '.supabase.co');
const SUPABASE_ANON_KEY_LIMPIA = String(SUPABASE_ANON_KEY).trim();

let URL_SUPABASE_VALIDA = false;
try {
    URL_SUPABASE_VALIDA = new URL(SUPABASE_URL_LIMPIA).protocol === 'https:';
} catch (error) {
    URL_SUPABASE_VALIDA = false;
}

const CREDENCIALES_REALES = URL_SUPABASE_VALIDA
    && Boolean(SUPABASE_ANON_KEY_LIMPIA)
    && !/[<>]/.test(SUPABASE_URL_LIMPIA)
    && !/[<>]/.test(SUPABASE_ANON_KEY_LIMPIA)
    && !SUPABASE_URL_LIMPIA.includes('TU-PROYECTO')
    && !SUPABASE_ANON_KEY_LIMPIA.includes('TU-ANON');

if (CREDENCIALES_REALES) {
    // Cliente único de Supabase (CDN oficial v2) compartido por todas las páginas
    const _sb = supabase.createClient(SUPABASE_URL_LIMPIA, SUPABASE_ANON_KEY_LIMPIA);
    window._sb = _sb;

    // Cliente SIEMPRE ANÓNIMO, solo para registrar pedidos.
    // ¿Por qué? Si el dueño prueba la tienda con la sesión del admin abierta
    // en el mismo navegador, la política de INSERT (que solo cubre 'anon')
    // rechazaría su propio pedido. Con este cliente el registro funciona
    // igual, haya sesión o no, y sin ver ni leer ninguna fila.
    window._sbAnon = supabase.createClient(SUPABASE_URL_LIMPIA, SUPABASE_ANON_KEY_LIMPIA, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            // Clave distinta para evitar el aviso de "Multiple GoTrueClient instances".
            storageKey: 'amorebox-anon-pedidos'
        }
    });
} else {
    console.warn('[Amorebox] Supabase sin configurar: define SUPABASE_URL y SUPABASE_ANON_KEY en el .env (local) o en las Environment Variables del proyecto en Vercel.');
}
