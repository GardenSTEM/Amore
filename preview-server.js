// Servidor estático mínimo (sin dependencias) para la vista previa del proyecto.
// Sirve el directorio del proyecto en http://127.0.0.1:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3001; // "0" u otros valores inválidos → 3001
const HOST = '127.0.0.1';
const ROOT = __dirname;

function readEnvFile() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return {};

    const values = {};
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?(SUPABASE_URL|SUPABASE_ANON_KEY)\s*=\s*(.*?)\s*$/);
        if (!match) continue;

        let value = match[2].replace(/\s+#.*$/, '').replace(/\s+\/\/.*$/, '').trim();
        value = value.replace(/;\s*$/, '').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        values[match[1]] = value.trim();
    }
    return values;
}

const envFile = readEnvFile();
const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || envFile.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || envFile.SUPABASE_ANON_KEY || ''
};

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
        if (urlPath === '/supabase-config.js') {
            const config = JSON.stringify(SUPABASE_CONFIG).replace(/</g, '\\u003c');
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
    console.log(`Amorebox preview server escuchando en http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} ya está en uso. Cierra el otro servidor o inicia este con otro puerto, por ejemplo: $env:PORT=3002; npm run dev`);
        process.exitCode = 1;
        return;
    }
    throw err;
});
