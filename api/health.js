// Diagnóstico: indica qué variables de entorno ve la función en Vercel,
// sin exponer sus valores. Útil para comprobar que el despliegue las tomó.
module.exports = (req, res) => {
    const presentes = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
        .reduce((acc, nombre) => {
            acc[nombre] = Boolean((process.env[nombre] || '').trim());
            return acc;
        }, {});

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({
        variables: presentes,
        vercelEnv: process.env.VERCEL_ENV || null,
        commit: process.env.VERCEL_GIT_COMMIT_SHA || null
    }));
};
