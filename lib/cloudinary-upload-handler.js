// =============================================================
//  AMOREBOX · SUBIDA DE IMÁGENES A CLOUDINARY
// -------------------------------------------------------------
//  Lógica compartida entre el servidor local (preview-server.js)
//  y la función serverless de Vercel (api/cloudinary-upload.js).
//  El secreto de Cloudinary nunca llega al navegador.
// =============================================================
const { uploadImage } = require('./cloudinary');

// Vercel limita el cuerpo de las funciones a ~4,5 MB, así que dejamos
// un margen de seguridad por debajo de ese límite.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function sendJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function getSupabaseConfig() {
    const url = (process.env.SUPABASE_URL || '')
        .trim()
        .replace(/\/+$/, '')
        .replace(/\/rest\/v1.*$/, '');
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    return { url, anonKey };
}

function detectImageType(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return '';
}

function readImageBody(req) {
    // En Vercel el cuerpo binario ya viene disponible como Buffer en req.body.
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body, 'binary'));
    if (req.body !== undefined && req.body !== null) {
        return Promise.reject(Object.assign(new Error('No se pudo leer la imagen enviada.'), { status: 400 }));
    }

    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        let tooLarge = false;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_IMAGE_BYTES && !tooLarge) {
                tooLarge = true;
                reject(Object.assign(new Error('La imagen supera el límite de 4 MB.'), { status: 413 }));
                req.resume();
                return;
            }
            if (!tooLarge) chunks.push(chunk);
        });
        req.on('end', () => {
            if (!tooLarge) resolve(Buffer.concat(chunks));
        });
        req.on('error', reject);
    });
}

async function subirImagenCloudinary(req, res) {
    if (req.method !== 'POST') {
        req.resume();
        res.setHeader('Allow', 'POST');
        sendJson(res, 405, { error: 'Método no permitido.' });
        return;
    }

    const declaredSize = Number(req.headers['content-length']);
    if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
        req.resume();
        sendJson(res, 413, { error: 'La imagen supera el límite de 4 MB.' });
        return;
    }

    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();
    const authorization = req.headers.authorization || '';
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token || !supabaseUrl || !supabaseAnonKey) {
        req.resume();
        sendJson(res, 401, { error: 'Inicia sesión para subir imágenes.' });
        return;
    }

    const productId = req.headers['x-product-id'] || '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
        req.resume();
        sendJson(res, 400, { error: 'El identificador del producto no es válido.' });
        return;
    }

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10000)
    });
    if (authResponse.status === 401 || authResponse.status === 403) {
        req.resume();
        sendJson(res, 401, { error: 'La sesión expiró. Inicia sesión nuevamente.' });
        return;
    }
    if (!authResponse.ok) {
        req.resume();
        sendJson(res, 502, { error: 'No se pudo validar la sesión con Supabase.' });
        return;
    }

    const buffer = await readImageBody(req);
    const detectedType = detectImageType(buffer);
    const declaredType = (req.headers['x-image-type'] || '').split(';')[0].trim().toLowerCase();
    const contentTypeHeader = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const typeMatches = detectedType
        && (declaredType ? declaredType === detectedType : contentTypeHeader === detectedType);
    if (!typeMatches) {
        sendJson(res, 415, { error: 'Formato no válido. Usa una imagen JPG, PNG o WebP.' });
        return;
    }

    const result = await uploadImage(buffer, {
        publicId: `productos/${productId}`,
        filename: `${productId}.${detectedType === 'image/jpeg' ? 'jpg' : detectedType.split('/')[1]}`,
        contentType: detectedType
    });
    sendJson(res, 200, result);
}

module.exports = { MAX_IMAGE_BYTES, sendJson, getSupabaseConfig, detectImageType, readImageBody, subirImagenCloudinary };
