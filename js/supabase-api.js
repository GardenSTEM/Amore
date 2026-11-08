// =============================================================
//  AMOREBOX · API DE DATOS (CRUD completo sobre Supabase)
//  Funciones compartidas por las páginas públicas y el panel admin.
//  Requiere js/supabase-config.js (variable global _sb).
// =============================================================

/* ------------------------- LECTURA ------------------------- */

// Devuelve todos los productos. categoria: 'cartera' | 'arreglo' | null (todos)
async function obtenerProductos(categoria = null) {
    let query = _sb.from('productos').select('*').order('nombre', { ascending: true });
    if (categoria) query = query.eq('categoria', categoria);
    const { data, error } = await query;
    if (error) { console.error('obtenerProductos:', error.message); throw error; }
    return data || [];
}

// Devuelve solo los productos destacados ("Lo más vendido" del index)
async function obtenerDestacados(limite = 6) {
    const { data, error } = await _sb
        .from('productos')
        .select('*')
        .eq('destacado', true)
        .order('nombre', { ascending: true })
        .limit(limite);
    if (error) { console.error('obtenerDestacados:', error.message); throw error; }
    return data || [];
}

// Devuelve los productos marcados para la sección "Arreglos de tienda" del index
async function obtenerArreglosTienda(limite = 12) {
    const { data, error } = await _sb
        .from('productos')
        .select('*')
        .eq('categoria', 'arreglo')
        .eq('en_tienda', true)
        .order('nombre', { ascending: true })
        .limit(limite);
    if (error) { console.error('obtenerArreglosTienda:', error.message); throw error; }
    return data || [];
}

/* ------------------------- CREAR ------------------------- */

async function crearProducto(producto) {
    const { data, error } = await _sb.from('productos').insert([producto]).select().single();
    if (error) { console.error('crearProducto:', error.message); throw error; }
    return data;
}

/* ------------------------ ACTUALIZAR ---------------------- */

async function actualizarProducto(id, cambios) {
    const { data, error } = await _sb.from('productos').update(cambios).eq('id', id).select().single();
    if (error) { console.error('actualizarProducto:', error.message); throw error; }
    return data;
}

/* ------------------------- BORRAR ------------------------- */

async function eliminarProducto(id) {
    const { error } = await _sb.from('productos').delete().eq('id', id);
    if (error) { console.error('eliminarProducto:', error.message); throw error; }
    return true;
}

/* ------------------------ CLOUDINARY ---------------------- */

// Vercel limita el cuerpo de las funciones a ~4,5 MB.
const MAX_IMAGEN_BYTES = 4 * 1024 * 1024;

// El servidor valida la sesión y firma la subida; el secreto nunca llega al navegador.
async function subirImagen(file, productoId) {
    if (file.size > MAX_IMAGEN_BYTES) {
        throw new Error('La imagen supera el límite de 4 MB. Comprímela o usa una más pequeña.');
    }

    const { data, error } = await _sb.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error('Inicia sesión para subir imágenes.');

    // Se envía como octet-stream para que Vercel entregue el cuerpo binario
    // sin intentar parsearlo; el tipo real viaja en X-Image-Type.
    const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/octet-stream',
            'X-Image-Type': file.type,
            'X-Product-Id': productoId
        },
        body: file
    });
    const text = await response.text();
    let result = {};
    try { result = JSON.parse(text); } catch (parseError) { /* respuesta no JSON */ }
    if (!response.ok) {
        const mensaje = result.error
            || (response.status === 413
                ? 'La imagen supera el límite permitido por el servidor (4 MB).'
                : `Error subiendo imagen (HTTP ${response.status}).`);
        throw new Error(mensaje);
    }
    if (!result.url || !result.url.startsWith('https://res.cloudinary.com/')) {
        throw new Error('Cloudinary no devolvió una URL válida.');
    }
    return result.url;
}

/* ------------------------ AUTENTICACIÓN -------------------- */

async function iniciarSesionAdmin(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function cerrarSesionAdmin() {
    const { error } = await _sb.auth.signOut();
    if (error) throw error;
}

// Devuelve la sesión activa o null
async function sesionActual() {
    const { data } = await _sb.auth.getSession();
    return data.session;
}

/* --------------------------- REALTIME ---------------------- */

// Suscripción a cambios de la tabla productos (catálogo siempre al día).
// onCambios(recibidos, insertados, actualizados, eliminados) se llama en cada evento.
function suscribirseAProductos(onCambios) {
    return _sb.channel('productos-catalogo')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'productos' },
            (payload) => {
                if (payload.eventType === 'INSERT') onCambios(null, payload.new, null, null);
                else if (payload.eventType === 'UPDATE') onCambios(null, null, payload.new, null);
                else if (payload.eventType === 'DELETE') onCambios(null, null, null, payload.old);
                else onCambios(payload, null, null, null);
            })
        .subscribe();
}

/* ------------------------- PEDIDOS ------------------------- */

// Convierte un precio formateado ('', '$1.250,50', '50.00') a número.
// Soporta el formato es-VE (punto = miles, coma = decimales) y el simple.
function precioANumero(valor) {
    if (typeof valor === 'number') return valor;
    let s = String(valor || '').replace(/[^0-9.,-]/g, '');
    if (/,.\d{1,2}$/.test(s)) { s = s.replace(/\./g, '').replace(',', '.'); }
    else { s = s.replace(/,/g, ''); }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

// =============================================================
//  REGISTRO DE PEDIDOS — FUNCIÓN CENTRAL DE LA TIENDA
//  TODOS los flujos de compra (bolsa, "Comprar Ahora" del index
//  y de los catálogos) deben pasar por aquí ANTES de abrir
//  WhatsApp. Nunca lanza ni bloquea la venta: si Supabase no
//  responde, devuelve false y el WhatsApp abre igual.
//
//  items: [{ nombre, cantidad, precio }] · precio puede venir
//  formateado ('', '$50') — se normaliza solo.
//  origen: 'bolsa' | 'directo'
//  Devuelve true si el pedido quedó guardado en el panel.
// =============================================================
async function registrarPedidoDesdeTienda(items, total, origen = 'web') {
    try {
        // Cliente SIEMPRE anónimo: el registro funciona incluso si el dueño
        // prueba la tienda con la sesión del admin abierta en el navegador.
        const sb = (typeof _sbAnon !== 'undefined') ? _sbAnon : _sb;
        if (!sb) {
            console.warn('[Amorebox] Supabase no está cargado en esta página; el pedido no se registra.');
            return false;
        }
        const limpios = (items || []).map(it => ({
            nombre: String(it.nombre || 'Producto').trim(),
            cantidad: Math.max(1, parseInt(it.cantidad, 10) || 1),
            precio: precioANumero(it.precio)
        }));
        const totalLimpio = Number(total) > 0
            ? Number(total)
            : limpios.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
        const { error } = await sb.from('pedidos').insert([{
            items: limpios,
            total: Number(totalLimpio.toFixed(2)),
            origen
        }]);
        if (error) {
            console.error('[Amorebox] No se pudo registrar el pedido:', error.message);
            return false;
        }
        console.log('[Amorebox] Pedido registrado en el panel ✔');
        return true;
    } catch (e) {
        console.error('[Amorebox] Error inesperado registrando el pedido:', e);
        return false;
    }
}

// Registra un pedido en la tabla `pedidos` (público). Devuelve true si quedó guardado.
// items: [{ nombre, cantidad, precio }]  ·  total: número
// NOTA: se inserta SIN `.select()` porque el visitante anónimo no puede
// leer la tabla (solo el admin la lee) y pedir la fila de vuelta violaría RLS.
async function registrarPedido(items, total, notas = null) {
    const { error } = await _sb
        .from('pedidos')
        .insert([{ items, total, notas, origen: 'web' }]);
    if (error) { console.error('registrarPedido:', error.message); throw error; }
    return true;
}

// Lista los pedidos (solo admin, exige sesión). orden: más nuevo primero.
async function obtenerPedidos(limite = 100) {
    const { data, error } = await _sb
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(limite);
    if (error) { console.error('obtenerPedidos:', error.message); throw error; }
    return data || [];
}

// Cambia el estado de un pedido: 'nuevo' | 'confirmado' | 'entregado' | 'cancelado'
async function cambiarEstadoPedido(id, estado) {
    const { data, error } = await _sb
        .from('pedidos')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('cambiarEstadoPedido:', error.message); throw error; }
    return data;
}

// Suscripción en tiempo real a la tabla pedidos: onPedidoNuevo(fila) se dispara
// con cada INSERT (nuevo pedido entrante).
function suscribirseAPedidos(onPedidoNuevo) {
    return _sb.channel('pedidos-panel')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'pedidos' },
            (payload) => onPedidoNuevo(payload.new))
        .subscribe();
}

/* ------------------------- UTILIDADES ---------------------- */

// Formatea el precio: null/'' → '' ; número → "$XX" o "$XX.XX" si tiene decimales
function formatearPrecioAmore(precio) {
    if (precio === null || precio === undefined || precio === '') return '';
    const num = Number(precio);
    if (Number.isNaN(num)) return '';
    return Number.isInteger(num) ? `$${num}` : `$${num.toFixed(2)}`;
}

/* --------------------------- STOCK ------------------------- */

// ¿Hay stock disponible? (stock null o undefined se trata como disponible)
function hayStock(p) {
    return p.stock === null || p.stock === undefined || Number(p.stock) > 0;
}

// Texto del estado de stock: { clase: 'agotado'|'ultimas'|'', texto }
function estadoStock(p) {
    if (!hayStock(p)) return { clase: 'agotado', texto: 'Agotado' };
    if (p.stock !== null && p.stock !== undefined && Number(p.stock) > 0 && Number(p.stock) <= 3) {
        return { clase: 'ultimas', texto: `¡Últimas ${p.stock}!` };
    }
    return { clase: '', texto: '' };
}

// Inserta el badge de stock dentro de la tarjeta (el CSS de cada página lo posiciona)
function agregarBadgeStock(card, p) {
    const estado = estadoStock(p);
    if (!estado.clase) return;
    if (estado.clase === 'agotado') card.classList.add('agotada');
    const badge = document.createElement('span');
    badge.className = `stock-badge ${estado.clase}`;
    badge.textContent = estado.texto;
    card.appendChild(badge);
}

// Devuelve una URL de Cloudinary con el ancho adecuado para la pantalla.
// Cloudinary guarda las transformaciones después de /image/upload/; si ya
// existe una (f_auto,q_auto,w_900...), se reemplaza para no acumularlas.
function urlImagenCloudinary(url, ancho) {
    if (!url || !url.includes('/image/upload/')) return url;
    const [base, resto] = url.split('/image/upload/');
    if (!base || !resto) return url;
    const segmentos = resto.split('/');
    if (segmentos.length > 1 && !/^v\d+$/.test(segmentos[0])) segmentos.shift();
    return `${base}/image/upload/f_auto,q_auto,w_${ancho},c_limit/${segmentos.join('/')}`;
}

// Construye la tarjeta de producto con el MISMO marcado que el HTML estático.
// Reutiliza limpiarRutaImagen() y manejarErrorImagen() de los scripts de catálogo.
function crearTarjetaProducto(p) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-price', p.precio ?? '');
    if (p.categoria === 'cartera') card.setAttribute('data-brand', p.marca || '');
    card.dataset.categoria = p.categoria || '';
    card.dataset.stock = p.stock ?? '';

    const nombre = p.nombre || '';
    const detalle = (p.categoria === 'cartera') ? (p.marca || '') : (p.descripcion || '');
    const precioTxt = formatearPrecioAmore(p.precio);
    const ruta = (typeof limpiarRutaImagen === 'function') ? limpiarRutaImagen(p.imagen_url) : p.imagen_url;
    const rutaOriginal = p.imagen_url || '';

    const esc = (t) => String(t ?? '').replace(/'/g, "\\'");
    const stockArg = (p.stock === null || p.stock === undefined) ? '' : String(p.stock);

    card.setAttribute('onclick',
        `openModal('${esc(nombre)}', '${esc(detalle)}', '${esc(precioTxt)}', '${esc(rutaOriginal)}', '${esc(stockArg)}')`);

    const img = document.createElement('img');
    if (ruta && ruta.includes('/image/upload/')) {
        // Imagen responsiva: el navegador descarga solo el tamaño que necesita.
        img.src = urlImagenCloudinary(ruta, 500);
        img.srcset = [
            `${urlImagenCloudinary(ruta, 300)} 300w`,
            `${urlImagenCloudinary(ruta, 500)} 500w`,
            `${urlImagenCloudinary(ruta, 900)} 900w`
        ].join(', ');
        img.sizes = '(max-width: 768px) 45vw, 300px';
    } else {
        img.src = ruta;
    }
    img.alt = nombre;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = function () { if (typeof manejarErrorImagen === 'function') manejarErrorImagen(this, rutaOriginal); };

    const info = document.createElement('div');
    info.className = 'Product-info';
    const h3 = document.createElement('h3');
    h3.textContent = nombre;
    const par = document.createElement('p');
    par.textContent = detalle;
    const span = document.createElement('span');
    span.className = 'price';
    span.textContent = precioTxt;

    info.appendChild(h3);
    info.appendChild(par);
    info.appendChild(span);
    card.appendChild(img);
    card.appendChild(info);
    agregarBadgeStock(card, p);
    return card;
}
