// Servidor estático mínimo (sin dependencias) para la vista previa del proyecto.
// Sirve el directorio del proyecto en http://127.0.0.1:3001
const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { uploadImage } = require('./lib/cloudinary');

loadEnv(__dirname);
const PORT = Number(process.env.PORT) || 3001; // "0" u otros valores inválidos → 3001
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPABASE_URL = (process.env.SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1.*$/, '');
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

function sendJson(res, status, payload) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

function readImageBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        let tooLarge = false;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_IMAGE_BYTES && !tooLarge) {
                tooLarge = true;
                reject(Object.assign(new Error('La imagen supera el límite de 10 MB.'), { status: 413 }));
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

function detectImageType(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return '';
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
        sendJson(res, 413, { error: 'La imagen supera el límite de 10 MB.' });
        return;
    }

    const authorization = req.headers.authorization || '';
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
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

    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
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
    const contentType = detectImageType(buffer);
    if (!contentType || req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== contentType) {
        sendJson(res, 415, { error: 'Formato no válido. Usa una imagen JPG, PNG o WebP.' });
        return;
    }

    const result = await uploadImage(buffer, {
        publicId: `productos/${productId}`,
        filename: `${productId}.${contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]}`,
        contentType
    });
    sendJson(res, 200, result);
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
    try {
        let urlPath = decodeURIComponent(req.url.split('?')[0]);
        if (urlPath === '/api/cloudinary-upload') {
            subirImagenCloudinary(req, res).catch(error => {
                console.error('[Amorebox] Error subiendo imagen a Cloudinary:', error.message);
                req.resume();
                if (!res.headersSent) sendJson(res, error.status || 502, { error: error.message || 'No se pudo subir la imagen.' });
                else res.destroy();
            });
            return;
        }
        if (urlPath === '/supabase-config.js') {
            const config = JSON.stringify({
                url: SUPABASE_URL,
                anonKey: SUPABASE_ANON_KEY
            }).replace(/</g, '\\u003c');
            res.writeHead(200, {
                'Content-Type': 'text/javascript; charset=utf-8',
                'Cache-Control': 'no-store'
            });
            res.end(`window.AMOREBOX_SUPABASE_CONFIG = ${config};`);
            return;
        }
        if (urlPath === '/') urlPath = '/index.html';

        // Normaliza y evita salir del directorio raíz
        const filePath = path.normalize(path.join(ROOT, urlPath));
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403); res.end('Forbidden'); return;
        }

        fs.stat(filePath, (err, stat) => {
            if (!err && stat.isDirectory()) {
                res.writeHead(404); res.end('Not Found'); return;
            }
            if (err || !stat.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, {
                'Content-Type': MIME[ext] || 'application/octet-stream',
                // Evita que el navegador use copias viejas de HTML/CSS/JS
                // mientras se edita (los cambios no "se ven" si hay cache).
                'Cache-Control': 'no-store'
            });
            fs.createReadStream(filePath).pipe(res);
        });
    } catch (e) {
        res.writeHead(500); res.end('Server Error');
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Amorebox preview server escuchando en http://127.0.0.1:${PORT} (bind ${HOST})`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} ya está en uso. Cierra el otro servidor o inicia este con otro puerto, por ejemplo: $env:PORT=3002; npm run dev`);
        process.exitCode = 1;
        return;
    }
    throw err;
});
