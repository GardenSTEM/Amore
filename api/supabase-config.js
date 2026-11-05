// Función serverless de Vercel: entrega la configuración pública de Supabase
// a partir de las variables de entorno del proyecto (SUPABASE_URL, SUPABASE_ANON_KEY).
// Se sirve en /supabase-config.js mediante el rewrite de vercel.json.
const { getSupabaseConfig } = require('../lib/cloudinary-upload-handler');

module.exports = (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const config = JSON.stringify(getSupabaseConfig()).replace(/</g, '\\u003c');
    res.end(`window.AMOREBOX_SUPABASE_CONFIG = ${config};`);
};
