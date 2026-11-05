// Función serverless de Vercel: valida la sesión de Supabase y sube la imagen
// a Cloudinary. Usa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.
const { sendJson, subirImagenCloudinary } = require('../lib/cloudinary-upload-handler');

module.exports = async (req, res) => {
    try {
        await subirImagenCloudinary(req, res);
    } catch (error) {
        console.error('[Amorebox] Error subiendo imagen a Cloudinary:', error.message);
        req.resume();
        if (!res.headersSent) {
            sendJson(res, error.status || 502, { error: error.message || 'No se pudo subir la imagen.' });
        } else {
            res.end();
        }
    }
};
