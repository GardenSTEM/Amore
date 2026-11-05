// Servidor estático mínimo (sin dependencias) para la vista previa del proyecto.
// Sirve el directorio del proyecto en http://127.0.0.1:3001
const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { sendJson, getSupabaseConfig, subirImagenCloudinary } = require('./lib/cloudinary-upload-handler');

loadEnv(__dirname);
const PORT = Number(process.env.PORT) || 3001; // "0" u otros valores inválidos → 3001
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;

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
            const config = JSON.stringify(getSupabaseConfig()).replace(/</g, '\\u003c');
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
