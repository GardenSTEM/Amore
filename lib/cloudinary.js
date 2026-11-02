const crypto = require('crypto');

function getCloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env.');
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cloudName)) {
        throw new Error('CLOUDINARY_CLOUD_NAME no tiene un formato válido.');
    }
    return { cloudName, apiKey, apiSecret };
}

function createSignature(params, apiSecret) {
    const content = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return crypto.createHash('sha1').update(`${content}${apiSecret}`).digest('hex');
}

function optimizedImageUrl(secureUrl) {
    const marker = '/image/upload/';
    const index = secureUrl.indexOf(marker);
    if (index < 0) throw new Error('Cloudinary no devolvió una URL de imagen válida.');
    return `${secureUrl.slice(0, index + marker.length)}f_auto,q_auto,w_900,c_limit/${secureUrl.slice(index + marker.length)}`;
}

function networkError(service, url, error) {
    const hostname = new URL(url).hostname;
    const cause = error && error.cause;
    const code = cause && cause.code;
    const detail = code ? ` (${code})` : '';
    return new Error(`No se pudo conectar con ${service} en ${hostname}${detail}.`, { cause: error });
}

async function uploadImage(buffer, { publicId, filename, contentType }) {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
        folder: 'amorebox',
        public_id: publicId,
        timestamp: String(timestamp),
        overwrite: 'true',
        invalidate: 'true'
    };
    const form = new FormData();
    for (const [key, value] of Object.entries(params)) form.append(key, value);
    form.append('api_key', apiKey);
    form.append('signature', createSignature(params, apiSecret));
    form.append('file', new Blob([buffer], { type: contentType }), filename);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    let response;
    try {
        response = await fetch(uploadUrl, {
            method: 'POST',
            body: form,
            signal: AbortSignal.timeout(60000)
        });
    } catch (error) {
        throw networkError('Cloudinary', uploadUrl, error);
    }
    const result = await response.json();
    if (!response.ok || !result.secure_url) {
        const message = result.error && result.error.message;
        throw new Error(message ? `Cloudinary rechazó la imagen: ${message}` : `Cloudinary respondió HTTP ${response.status}.`);
    }

    return {
        url: optimizedImageUrl(result.secure_url),
        publicId: result.public_id
    };
}

module.exports = { getCloudinaryConfig, networkError, optimizedImageUrl, uploadImage };
