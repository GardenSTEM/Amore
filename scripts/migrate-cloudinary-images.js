const fs = require('fs');
const path = require('path');
const { loadEnv } = require('../lib/env');
const { getCloudinaryConfig, networkError, uploadImage } = require('../lib/cloudinary');

const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'supabase', 'seed.sql');
const MIGRATION_PATH = path.join(ROOT, 'supabase', 'cloudinary-migration.sql');
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function parseSqlValue(sql, state) {
    while (/\s/.test(sql[state.index] || '')) state.index++;
    if (sql[state.index] === "'") {
        state.index++;
        let value = '';
        while (state.index < sql.length) {
            if (sql[state.index] === "'" && sql[state.index + 1] === "'") {
                value += "'";
                state.index += 2;
            } else if (sql[state.index] === "'") {
                state.index++;
                return value;
            } else {
                value += sql[state.index++];
            }
        }
        throw new Error('El seed.sql contiene una cadena SQL sin cerrar.');
    }

    const start = state.index;
    while (state.index < sql.length && sql[state.index] !== ',' && sql[state.index] !== ')') state.index++;
    const token = sql.slice(start, state.index).trim();
    if (token.toUpperCase() === 'NULL') return null;
    if (token.toLowerCase() === 'true') return true;
    if (token.toLowerCase() === 'false') return false;
    const number = Number(token);
    return token !== '' && !Number.isNaN(number) ? number : token;
}

function parseSeedRows(sql) {
    const valuesAt = sql.toUpperCase().indexOf('VALUES');
    if (valuesAt < 0) throw new Error('No se encontró VALUES en supabase/seed.sql.');

    const rows = [];
    const state = { index: valuesAt + 'VALUES'.length };
    while (state.index < sql.length) {
        while (state.index < sql.length) {
            if (/\s|,/.test(sql[state.index])) {
                state.index++;
            } else if (sql.startsWith('--', state.index)) {
                const end = sql.indexOf('\n', state.index);
                state.index = end < 0 ? sql.length : end + 1;
            } else {
                break;
            }
        }
        if (sql[state.index] !== '(') break;
        state.index++;

        const values = [];
        while (state.index < sql.length) {
            values.push(parseSqlValue(sql, state));
            while (/\s/.test(sql[state.index] || '')) state.index++;
            if (sql[state.index] === ',') {
                state.index++;
                continue;
            }
            if (sql[state.index] === ')') {
                state.index++;
                break;
            }
            throw new Error('No se pudo interpretar una fila de supabase/seed.sql.');
        }
        if (values.length < 6) throw new Error('Fila de producto incompleta en supabase/seed.sql.');
        if (typeof values[5] === 'string') {
            rows.push({
                categoria: values[0],
                nombre: values[1],
                imagen: values[5]
            });
        }
    }
    if (!rows.length) throw new Error('No se encontraron imágenes locales en supabase/seed.sql.');
    return rows;
}

function productKey(product) {
    return `${product.categoria}\0${product.nombre.toLocaleLowerCase('es')}`;
}

function resolveLocalImage(relativePath) {
    const normalized = relativePath.replace(/[\\/]/g, path.sep);
    const exactPath = path.resolve(ROOT, normalized);
    if (!exactPath.startsWith(`${ROOT}${path.sep}`)) throw new Error(`Ruta fuera del proyecto en seed.sql: ${relativePath}`);
    if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) return exactPath;

    const directory = path.dirname(exactPath);
    if (!fs.existsSync(directory)) return null;
    const requestedBase = path.basename(exactPath, path.extname(exactPath)).toLocaleLowerCase('en');
    const matches = fs.readdirSync(directory).filter(name =>
        path.basename(name, path.extname(name)).toLocaleLowerCase('en') === requestedBase
        && /\.(jpe?g|png|webp)$/i.test(name)
    );
    if (matches.length > 1) throw new Error(`Hay varias imágenes que coinciden con ${relativePath}.`);
    return matches.length ? path.join(directory, matches[0]) : null;
}

function imageType(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return '';
}

function quoteSql(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
}

function getSupabaseConfig() {
    const supabaseUrl = (process.env.SUPABASE_URL || '')
        .trim()
        .replace(/\/+$/, '')
        .replace(/\/rest\/v1.*$/, '');
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    if (!supabaseUrl || !anonKey || /[<>]/.test(supabaseUrl + anonKey)) {
        throw new Error('Configura SUPABASE_URL y SUPABASE_ANON_KEY reales en .env para migrar productos existentes.');
    }
    let parsedUrl;
    try {
        parsedUrl = new URL(supabaseUrl);
    } catch {
        throw new Error('SUPABASE_URL no es válida.');
    }
    if (parsedUrl.protocol !== 'https:' || !/\.supabase\.co$/i.test(parsedUrl.hostname)) {
        throw new Error('SUPABASE_URL debe ser la URL HTTPS del proyecto Supabase.');
    }
    return { supabaseUrl, anonKey };
}

async function fetchProducts({ supabaseUrl, anonKey }) {
    const url = `${supabaseUrl}/rest/v1/productos?select=id,categoria,nombre,imagen_url&limit=1000`;
    let response;
    try {
        response = await fetch(url, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
            signal: AbortSignal.timeout(15000)
        });
    } catch (error) {
        throw networkError('Supabase', url, error);
    }
    if (!response.ok) throw new Error(`No se pudieron leer los productos de Supabase (HTTP ${response.status}).`);
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Supabase devolvió una lista de productos no válida.');
    return products;
}

function legacyStorageUrl(imagePath, supabaseUrl) {
    const normalized = imagePath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    if (!/^(Arreglos|Carteras)$/i.test(segments[0]) || segments.length !== 2 || !segments[1] || segments[1] === '.' || segments[1] === '..') {
        throw new Error('La ruta de imagen existente no es local ni pertenece a una ruta de catálogo conocida.');
    }
    const encodedPath = normalized.split('/').map(encodeURIComponent).join('/');
    return `${supabaseUrl}/storage/v1/object/public/productos/${encodedPath}`;
}

async function downloadExistingImage(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('La URL de imagen existente no es válida.');
    }
    if (parsed.protocol !== 'https:' || !/\.supabase\.co$/i.test(parsed.hostname)) {
        throw new Error('No se descargan imágenes externas automáticamente; copia primero el archivo a Arreglos/ o Carteras/.');
    }
    let response;
    try {
        response = await fetch(parsed, { signal: AbortSignal.timeout(30000) });
    } catch (error) {
        throw networkError('Supabase Storage', parsed, error);
    }
    if (!response.ok) throw new Error(`No se pudo descargar una imagen existente (HTTP ${response.status}).`);
    const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase() || '';
    if (!IMAGE_TYPES.has(contentType)) throw new Error(`Formato de imagen existente no soportado: ${contentType || 'desconocido'}.`);
    if (!response.body) throw new Error('La imagen existente llegó sin contenido.');
    const declaredSize = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_SOURCE_BYTES) {
        throw new Error('Una imagen existente supera el límite de 10 MB.');
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_SOURCE_BYTES) {
            throw new Error('Una imagen existente supera el límite de 10 MB.');
        }
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    if (imageType(buffer) !== contentType) throw new Error('El contenido de una imagen existente no coincide con su formato.');
    return { buffer, contentType, filename: path.basename(parsed.pathname) || 'imagen' };
}

function createMigrationSql(products, urlByKey, seedRows) {
    const statements = ['BEGIN;'];
    const knownSeedKeys = new Set();
    for (const row of seedRows) {
        const key = productKey(row);
        knownSeedKeys.add(key);
        const url = urlByKey.get(key);
        if (!url) throw new Error(`No se generó una URL para ${row.categoria}: ${row.nombre}.`);
        statements.push(
            `UPDATE public.productos SET imagen_url = ${quoteSql(url)} WHERE categoria = ${quoteSql(row.categoria)} AND lower(nombre) = lower(${quoteSql(row.nombre)});`
        );
    }
    for (const product of products) {
        if (!product.imagen_url || knownSeedKeys.has(productKey(product))) continue;
        const url = urlByKey.get(product.id);
        if (url) statements.push(`UPDATE public.productos SET imagen_url = ${quoteSql(url)} WHERE id = ${quoteSql(product.id)};`);
    }
    statements.push('COMMIT;', '');
    return statements.join('\n');
}

async function main() {
    loadEnv(ROOT);
    const { cloudName } = getCloudinaryConfig();
    const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
    const seedRows = parseSeedRows(seedSql);
    const supabaseConfig = getSupabaseConfig();
    const products = await fetchProducts(supabaseConfig);
    const productByKey = new Map(products.map(product => [productKey(product), product]));
    const urlByKey = new Map();
    const migratedById = new Map();
    let uploaded = 0;
    let alreadyOnCloudinary = 0;

    for (const row of seedRows) {
        const product = productByKey.get(productKey(row));
        let source;
        if (/^https:\/\/res\.cloudinary\.com\//i.test(row.imagen)) {
            urlByKey.set(productKey(row), row.imagen);
            if (product && product.id) migratedById.set(product.id, row.imagen);
            alreadyOnCloudinary++;
            continue;
        }

        const localPath = resolveLocalImage(row.imagen);
        if (localPath) {
            const buffer = fs.readFileSync(localPath);
            source = { buffer, contentType: imageType(buffer), filename: path.basename(localPath) };
        } else if (product && product.imagen_url) {
            if (/^https:\/\/res\.cloudinary\.com\//i.test(product.imagen_url)) {
                urlByKey.set(productKey(row), product.imagen_url);
                if (product.id) migratedById.set(product.id, product.imagen_url);
                alreadyOnCloudinary++;
                continue;
            }
            const existingLocalPath = resolveLocalImage(product.imagen_url);
            if (existingLocalPath) {
                const buffer = fs.readFileSync(existingLocalPath);
                source = { buffer, contentType: imageType(buffer), filename: path.basename(existingLocalPath) };
            } else {
                const existingUrl = /^https:\/\//i.test(product.imagen_url)
                    ? product.imagen_url
                    : legacyStorageUrl(product.imagen_url, supabaseConfig.supabaseUrl);
                source = await downloadExistingImage(existingUrl);
            }
        } else {
            const storageUrl = legacyStorageUrl(row.imagen, supabaseConfig.supabaseUrl);
            source = await downloadExistingImage(storageUrl);
        }
        if (!IMAGE_TYPES.has(source.contentType) || imageType(source.buffer) !== source.contentType) {
            throw new Error(`Formato no válido en la imagen de "${row.nombre}". Usa JPG, PNG o WebP.`);
        }
        if (source.buffer.length > MAX_SOURCE_BYTES) throw new Error(`La imagen de "${row.nombre}" supera el límite de 10 MB.`);

        const publicId = `catalogo/${row.imagen.replace(/\\/g, '/').replace(/\.[^.]+$/, '')}`;
        let result;
        try {
            result = await uploadImage(source.buffer, {
                publicId,
                filename: source.filename,
                contentType: source.contentType
            });
        } catch (error) {
            throw new Error(`Falló la carga de la imagen de "${row.nombre}": ${error.message}`, { cause: error });
        }
        urlByKey.set(productKey(row), result.url);
        if (product && product.id) migratedById.set(product.id, result.url);
        uploaded++;
        console.log(`Imagen preparada en Cloudinary: ${row.categoria} / ${row.nombre}`);
    }

    for (const product of products) {
        if (!product.imagen_url || /^https:\/\/res\.cloudinary\.com\//i.test(product.imagen_url)) continue;
        if (migratedById.has(product.id)) continue;

        const localPath = resolveLocalImage(product.imagen_url);
        let source;
        if (localPath) {
            const buffer = fs.readFileSync(localPath);
            source = { buffer, contentType: imageType(buffer), filename: path.basename(localPath) };
        } else {
            const existingUrl = /^https:\/\//i.test(product.imagen_url)
                ? product.imagen_url
                : legacyStorageUrl(product.imagen_url, supabaseConfig.supabaseUrl);
            source = await downloadExistingImage(existingUrl);
        }
        if (!IMAGE_TYPES.has(source.contentType) || imageType(source.buffer) !== source.contentType) {
            throw new Error(`Formato no válido en la imagen de "${product.nombre}". Usa JPG, PNG o WebP.`);
        }
        if (source.buffer.length > MAX_SOURCE_BYTES) throw new Error(`La imagen de "${product.nombre}" supera el límite de 10 MB.`);

        let result;
        try {
            result = await uploadImage(source.buffer, {
                publicId: `productos/${product.id}`,
                filename: source.filename,
                contentType: source.contentType
            });
        } catch (error) {
            throw new Error(`Falló la carga de la imagen de "${product.nombre}": ${error.message}`, { cause: error });
        }
        migratedById.set(product.id, result.url);
        uploaded++;
        console.log(`Imagen preparada en Cloudinary: ${product.categoria} / ${product.nombre}`);
    }

    let updatedSeed = seedSql;
    for (const row of seedRows) {
        const url = urlByKey.get(productKey(row));
        const oldValue = quoteSql(row.imagen);
        const newValue = quoteSql(url);
        const firstIndex = updatedSeed.indexOf(oldValue);
        if (firstIndex < 0) throw new Error(`No se encontró la imagen ${row.imagen} en seed.sql.`);
        updatedSeed = updatedSeed.slice(0, firstIndex) + newValue + updatedSeed.slice(firstIndex + oldValue.length);
    }

    const migrationSql = createMigrationSql(products, new Map([
        ...urlByKey,
        ...migratedById
    ]), seedRows);
    fs.writeFileSync(SEED_PATH, updatedSeed, 'utf8');
    fs.writeFileSync(MIGRATION_PATH, migrationSql, 'utf8');

    console.log(`\nMigración preparada para ${cloudName}: ${uploaded} imágenes subidas, ${alreadyOnCloudinary} ya estaban en Cloudinary.`);
    console.log(`Seed actualizado: ${path.relative(ROOT, SEED_PATH)}`);
    console.log(`Ejecuta en Supabase SQL Editor: ${path.relative(ROOT, MIGRATION_PATH)}`);
}

if (require.main === module) {
    main().catch(error => {
        let cause = error;
        while (cause.cause) cause = cause.cause;
        const detail = cause.code
            ? ` Causa de red: ${cause.code}${cause.message ? ` (${cause.message})` : ''}.`
            : '';
        console.error(`Migración detenida: ${error.message}${detail}`);
        process.exitCode = 1;
    });
}

module.exports = { createMigrationSql, legacyStorageUrl, parseSeedRows, resolveLocalImage };
