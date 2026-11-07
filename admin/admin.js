// =============================================================
//  AMOREBOX · PANEL DE ADMINISTRACIÓN
//  Autenticación + CRUD completo sobre la tabla `productos`.
// =============================================================

let productos = [];
let productoABorrar = null;
let filtroActual = 'todos';
let terminoBusqueda = '';
let pedidos = [];
let canalPedidos = null;

/* ==================== IMÁGENES ==================== */

// El panel se sirve en /admin (sin barra final), así que una ruta relativa
// como 'Carteras/...' se resolvería contra la raíz del dominio y fallaría.
// Se fuerza siempre una ruta raíz-relativa.
// URLs absolutas (incluidas las de Cloudinary) pasan intactas.
function urlImagenPanel(ruta) {
    const v = (ruta || '').trim();
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
    if (v.startsWith('/')) return v;                                   // ya es raíz-relativa
    return '/' + v.replace(/^\.\//, '');                               // 'Carteras/x.jpg' → '/Carteras/x.jpg'
}

/* ==================== ARRANQUE ==================== */

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof _sb === 'undefined') {
        document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif">' +
            '<h2>Supabase sin configurar</h2>' +
            '<p>Configura SUPABASE_URL y SUPABASE_ANON_KEY en el archivo <code>.env</code> (local) o en las Environment Variables de Vercel.</p></div>';
        return;
    }

    vincularEventos();
    aplicarBloqueoPendiente();

    // ¿Ya hay sesión activa? → dashboard directamente
    const sesion = await sesionActual();
    if (sesion) {
        mostrarDashboard(sesion.user.email);
    } else {
        document.getElementById('vista-login').classList.add('visible');
    }

    // Si la sesión se cierra desde otro lado (o expira), volver al login
    _sb.auth.onAuthStateChange((_evento, sesionNueva) => {
        if (!sesionNueva) {
            mostrarLogin();
        } else {
            mostrarDashboard(sesionNueva.user.email);
        }
    });
});

/* ==================== AUTENTICACIÓN ==================== */

function mostrarLogin() {
    document.getElementById('vista-dashboard').classList.remove('visible');
    document.getElementById('vista-login').classList.add('visible');
}

function mostrarDashboard(email) {
    document.getElementById('vista-login').classList.remove('visible');
    document.getElementById('vista-dashboard').classList.add('visible');
    document.getElementById('admin-email-sub').textContent = (email || 'Inventario y catálogo');
    cargarProductos();
    cargarPedidos();
    iniciarRealtimePedidos();
}

/* ------------------ LÍMITE DE INTENTOS DE ACCESO ------------------ */
// Bloqueo progresivo tras varios fallos seguidos. Se guarda en localStorage
// para que recargar la página no reinicie el contador.
// Es una defensa de interfaz: el límite real de peticiones lo aplica
// Supabase Auth en el servidor.
const GUARD_CLAVE = 'amorebox:login-guard';
const GUARD_MAX_FALLOS = 5;
const GUARD_ESCALONES = [60, 300, 900, 3600];      // 1 min, 5 min, 15 min, 1 h
const GUARD_DECADENCIA = 24 * 60 * 60 * 1000;      // olvida el nivel tras 24 h sin fallos

let guardTimer = null;

function leerGuard() {
    const vacio = { fallos: 0, nivel: 0, hasta: 0, ultimo: 0 };
    try {
        const crudo = localStorage.getItem(GUARD_CLAVE);
        if (!crudo) return vacio;
        const datos = JSON.parse(crudo) || {};
        const estado = {
            fallos: Number(datos.fallos) || 0,
            nivel: Number(datos.nivel) || 0,
            hasta: Number(datos.hasta) || 0,
            ultimo: Number(datos.ultimo) || 0
        };
        if (estado.ultimo && Date.now() - estado.ultimo > GUARD_DECADENCIA) return vacio;
        return estado;
    } catch (e) {
        return vacio; // localStorage bloqueado o JSON corrupto
    }
}

function escribirGuard(estado) {
    try { localStorage.setItem(GUARD_CLAVE, JSON.stringify(estado)); } catch (e) { /* modo privado */ }
}

function segundosBloqueado(estado = leerGuard()) {
    return Math.max(0, Math.ceil((estado.hasta - Date.now()) / 1000));
}

function formatearSegundos(total) {
    const min = Math.floor(total / 60);
    const seg = total % 60;
    return min > 0 ? `${min}:${String(seg).padStart(2, '0')}` : `${seg}s`;
}

function bloquearPorIntentos() {
    const btn = document.getElementById('btn-login');
    const error = document.getElementById('login-error');
    clearInterval(guardTimer);

    const pintar = () => {
        const restante = segundosBloqueado();
        if (restante <= 0) {
            clearInterval(guardTimer);
            guardTimer = null;
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión';
            error.hidden = true;
            return;
        }
        btn.disabled = true;
        btn.textContent = `Bloqueado (${formatearSegundos(restante)})`;
        error.textContent = `Demasiados intentos fallidos. Vuelve a intentarlo en ${formatearSegundos(restante)}.`;
        error.hidden = false;
    };

    pintar();
    if (segundosBloqueado() > 0) guardTimer = setInterval(pintar, 1000);
}

function aplicarBloqueoPendiente() {
    if (segundosBloqueado() > 0) bloquearPorIntentos();
}

// Devuelve true si este fallo activó un bloqueo.
function registrarFalloDeLogin() {
    const estado = leerGuard();
    estado.fallos += 1;
    estado.ultimo = Date.now();

    if (estado.fallos >= GUARD_MAX_FALLOS) {
        const indice = Math.min(estado.nivel, GUARD_ESCALONES.length - 1);
        estado.hasta = Date.now() + GUARD_ESCALONES[indice] * 1000;
        estado.nivel = Math.min(estado.nivel + 1, GUARD_ESCALONES.length);
        estado.fallos = 0;
        escribirGuard(estado);
        bloquearPorIntentos();
        return true;
    }

    escribirGuard(estado);
    return false;
}

function reiniciarGuard() {
    try { localStorage.removeItem(GUARD_CLAVE); } catch (e) { /* modo privado */ }
    clearInterval(guardTimer);
    guardTimer = null;
}

async function manejarLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    const error = document.getElementById('login-error');

    if (segundosBloqueado() > 0) {
        bloquearPorIntentos();
        return;
    }

    error.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
        await iniciarSesionAdmin(
            document.getElementById('login-email').value.trim(),
            document.getElementById('login-pass').value
        );
        reiniciarGuard();
        document.getElementById('login-pass').value = '';
        // onAuthStateChange se encarga de mostrar el dashboard
    } catch (err) {
        const mensaje = String((err && err.message) || '');
        const limiteServidor = (err && err.status === 429) || /rate limit|too many requests/i.test(mensaje);

        if (limiteServidor) {
            error.textContent = 'Supabase limitó temporalmente los intentos. Espera unos minutos antes de volver a probar.';
        } else if (!registrarFalloDeLogin()) {
            const quedan = Math.max(0, GUARD_MAX_FALLOS - leerGuard().fallos);
            error.textContent = `Correo o contraseña incorrectos. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`} antes del bloqueo.`;
        }
        error.hidden = false;
    } finally {
        if (segundosBloqueado() <= 0) {
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión';
        }
    }
}

async function manejarLogout() {
    try { await cerrarSesionAdmin(); } catch (e) { mostrarLogin(); }
}

/* ==================== CARGA Y RENDER ==================== */

async function cargarProductos() {
    try {
        productos = await obtenerProductos();
        renderizarTabla();
        renderizarStats();
    } catch (err) {
        console.error(err);
        toast('❌ Error cargando el inventario: ' + err.message, 4000);
    }
}

function productosFiltrados() {
    return productos.filter(p => {
        if (filtroActual === 'cartera' && p.categoria !== 'cartera') return false;
        if (filtroActual === 'arreglo' && p.categoria !== 'arreglo') return false;
        if (filtroActual === 'stock-bajo' && p.stock > 3) return false;
        const t = terminoBusqueda.toLowerCase();
        if (t && !(`${p.nombre} ${p.marca || ''}`.toLowerCase().includes(t))) return false;
        return true;
    });
}

function renderizarTabla() {
    const body = document.getElementById('tabla-body');
    const lista = productosFiltrados();

    if (!lista.length) {
        body.innerHTML = '<tr><td colspan="7" class="sin-resultados">No hay productos que coincidan.</td></tr>';
        return;
    }

    body.innerHTML = lista.map(p => {
        const thumb = p.imagen_url
            ? `<img class="prod-thumb" src="${escapeHtml(urlImagenPanel(p.imagen_url))}" alt="" onerror="this.style.visibility='hidden'">`
            : '<div class="prod-thumb"></div>';

        const stockClass = p.stock === 0 ? 'stock-0' : (p.stock <= 3 ? 'stock-bajo' : '');
        const stockTxt = `${p.stock} ${p.stock === 1 ? 'unidad' : 'unidades'}`;

        return `<tr>
            <td>
                <div class="prod-cell">
                    ${thumb}
                    <div>
                        <div class="prod-nombre">${escapeHtml(p.nombre)}</div>
                        <div class="prod-desc">${escapeHtml(p.descripcion || '')}</div>
                    </div>
                </div>
            </td>
            <td><span class="tag-categoria ${p.categoria === 'cartera' ? 'tag-cartera' : 'tag-arreglo'}">${p.categoria}</span></td>
            <td>${escapeHtml(p.marca || '—')}</td>
            <td>${formatearPrecioAmore(p.precio) || 'A consultar'}</td>
            <td><span class="stock-chip ${stockClass}">${stockTxt}</span></td>
            <td>${p.destacado ? '<span class="destacado-estrella">★</span>' : '<span class="destacado-no">☆</span>'}</td>
            <td>
                <div class="acciones">
                    <button class="btn btn-fantasma btn-chico" onclick="abrirFormEditar('${p.id}')">Editar</button>
                    <button class="btn btn-peligro btn-chico" onclick="pedirConfirmarBorrado('${p.id}')">Borrar</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderizarStats() {
    const total = productos.length;
    const carteras = productos.filter(p => p.categoria === 'cartera').length;
    const arreglos = productos.filter(p => p.categoria === 'arreglo').length;
    const agotados = productos.filter(p => p.stock === 0).length;
    const valor = productos.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-carteras').textContent = carteras;
    document.getElementById('stat-arreglos').textContent = arreglos;
    document.getElementById('stat-agotados').textContent = agotados;
    document.getElementById('stat-valor').textContent = '$' + valor.toLocaleString('es-VE', { maximumFractionDigits: 0 });
}

/* ==================== CRUD ==================== */

function abrirFormNuevo() {
    document.getElementById('modal-form-titulo').textContent = 'Nuevo producto';
    document.getElementById('form-producto').reset();
    document.getElementById('p-id').value = '';
    document.getElementById('p-stock').value = '1';
    document.getElementById('p-imagen-file').value = '';
    document.getElementById('form-error').hidden = true;
    abrirModal('modal-form');
}

function abrirFormEditar(id) {
    const p = productos.find(x => x.id === id);
    if (!p) return;

    document.getElementById('modal-form-titulo').textContent = `Editar: ${p.nombre}`;
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-categoria').value = p.categoria;
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-descripcion').value = p.descripcion || '';
    document.getElementById('p-marca').value = p.marca || '';
    document.getElementById('p-precio').value = p.precio ?? '';
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-imagen-file').value = '';
    document.getElementById('p-destacado').checked = !!p.destacado;
    document.getElementById('form-error').hidden = true;
    abrirModal('modal-form');
}

async function manejarGuardarProducto(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar');
    const error = document.getElementById('form-error');
    error.hidden = true;

    const id = document.getElementById('p-id').value;
    const esEdicion = !!id;

    const producto = {
        categoria: document.getElementById('p-categoria').value,
        nombre: document.getElementById('p-nombre').value.trim(),
        descripcion: document.getElementById('p-descripcion').value.trim(),
        marca: document.getElementById('p-marca').value.trim() || null,
        precio: document.getElementById('p-precio').value === '' ? null : Number(document.getElementById('p-precio').value),
        stock: parseInt(document.getElementById('p-stock').value, 10) || 0,
        destacado: document.getElementById('p-destacado').checked
    };

    if (!producto.nombre) {
        error.textContent = 'El nombre es obligatorio.';
        error.hidden = false;
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const file = document.getElementById('p-imagen-file').files[0];

        if (esEdicion) {
            const actual = productos.find(p => p.id === id);
            producto.imagen_url = file ? await subirImagen(file, id) : actual?.imagen_url || '';
            await actualizarProducto(id, producto);
            toast('✅ Producto actualizado');
        } else {
            const creado = await crearProducto({ ...producto, imagen_url: '' });
            if (file) {
                const url = await subirImagen(file, creado.id);
                await actualizarProducto(creado.id, { imagen_url: url });
            }
            toast('✅ Producto creado');
        }
        cerrarModal('modal-form');
        await cargarProductos();
    } catch (err) {
        error.textContent = 'Error: ' + (err.message || 'no se pudo guardar');
        error.hidden = false;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar producto';
    }
}

/* ==================== BORRADO CON CONFIRMACIÓN ==================== */

function pedirConfirmarBorrado(id) {
    const p = productos.find(x => x.id === id);
    if (!p) return;
    productoABorrar = p;
    document.getElementById('borrar-nombre').textContent = p.nombre;
    abrirModal('modal-borrar');
}

async function confirmarBorrado() {
    if (!productoABorrar) return;
    const btn = document.getElementById('btn-confirmar-borrar');
    btn.disabled = true;
    btn.textContent = 'Eliminando...';
    try {
        await eliminarProducto(productoABorrar.id);
        toast('🗑️ Producto eliminado');
        cerrarModal('modal-borrar');
        await cargarProductos();
    } catch (err) {
        toast('❌ Error al eliminar: ' + err.message, 4000);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sí, eliminar';
        productoABorrar = null;
    }
}

/* ==================== MODALES / UI ==================== */

function abrirModal(id) {
    document.getElementById(id).hidden = false;
}

function cerrarModal(id) {
    document.getElementById(id).hidden = true;
}

function toast(msg, duracion = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { t.hidden = true; }, duracion);
}

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/* ==================== EVENTOS ==================== */

function vincularEventos() {
    document.getElementById('form-login').addEventListener('submit', manejarLogin);
    document.getElementById('btn-cerrar-sesion').addEventListener('click', manejarLogout);
    document.getElementById('btn-nuevo').addEventListener('click', abrirFormNuevo);
    document.getElementById('form-producto').addEventListener('submit', manejarGuardarProducto);
    document.getElementById('btn-confirmar-borrar').addEventListener('click', confirmarBorrado);

    document.getElementById('buscador').addEventListener('input', (e) => {
        terminoBusqueda = e.target.value.trim();
        renderizarTabla();
    });

    // Pestañas Productos / Pedidos
    document.getElementById('tab-productos').addEventListener('click', () => cambiarPestana('productos'));
    document.getElementById('tab-pedidos').addEventListener('click', () => cambiarPestana('pedidos'));
    document.getElementById('btn-refrescar-pedidos').addEventListener('click', cargarPedidos);

    document.querySelectorAll('.chip[data-filtro]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip[data-filtro]').forEach(c => c.classList.remove('activo'));
            chip.classList.add('activo');
            filtroActual = chip.dataset.filtro;
            renderizarTabla();
        });
    });

    // Cierre de modales: botones con data-cerrar-modal y clic en el fondo
    document.querySelectorAll('[data-cerrar-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            cerrarModal(btn.closest('.modal-overlay').id);
        });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.hidden = true;
        });
    });

    // Escape cierra cualquier modal abierto (no interfiere con formularios)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => { m.hidden = true; });
        }
    });
}

/* ==================== PEDIDOS ==================== */

function cambiarPestana(pestana) {
    const esProductos = pestana === 'productos';
    document.getElementById('tab-productos').classList.toggle('activo', esProductos);
    document.getElementById('tab-pedidos').classList.toggle('activo', !esProductos);
    document.getElementById('pestana-productos').hidden = !esProductos;
    document.getElementById('pestana-pedidos').hidden = esProductos;
    if (!esProductos) cargarPedidos();
}

async function cargarPedidos() {
    const body = document.getElementById('tabla-pedidos-body');
    try {
        pedidos = await obtenerPedidos();
        renderizarPedidos();
        actualizarBadgePedidos();
    } catch (err) {
        // Código 42P01 = la tabla no existe todavía (falta ejecutar pedidos.sql)
        const esTablaFaltante = (err.code === '42P01') || /does not exist/i.test(err.message || '');
        body.innerHTML = `<tr><td colspan="4" class="pedidos-vacio">${esTablaFaltante
            ? '📦 Aún no existe la tabla de pedidos.<br>Ejecuta <strong>supabase/pedidos.sql</strong> en el SQL Editor de Supabase (una sola vez).'
            : 'No se pudieron cargar los pedidos: ' + escapeHtml(err.message || '')}</td></tr>`;
    }
}

function actualizarBadgePedidos() {
    const nuevos = pedidos.filter(p => p.estado === 'nuevo').length;
    const badge = document.getElementById('pedidos-badge');
    if (!badge) return;
    badge.textContent = nuevos;
    badge.hidden = nuevos === 0;
}

function formatearFechaPedido(iso) {
    try {
        return new Date(iso).toLocaleString('es-VE', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return iso || ''; }
}

function renderizarPedidos() {
    const body = document.getElementById('tabla-pedidos-body');
    if (!pedidos.length) {
        body.innerHTML = '<tr><td colspan="4" class="pedidos-vacio">Todavía no hay pedidos.<br>Cuando un cliente finalice su compra por WhatsApp, aparecerá aquí al instante.</td></tr>';
        return;
    }

    body.innerHTML = pedidos.map(p => {
        const items = Array.isArray(p.items) ? p.items : [];
        const itemsTxt = items.map(it =>
            `•${Number(it.cantidad) || 1}x ${escapeHtml(it.nombre || '')} — ${formatearPrecioAmore(it.precio) || '—'}`
        ).join('<br>') || '<em>sin detalle</em>';
        const notas = p.notas ? `<div class="pedido-notas">“${escapeHtml(p.notas)}”</div>` : '';

        return `<tr>
            <td class="pedido-fecha">${formatearFechaPedido(p.creado_en)}</td>
            <td><div class="pedido-items">${itemsTxt}${notas}</div></td>
            <td class="pedido-total">$${Number(p.total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td><span class="estado-chip estado-${escapeHtml(p.estado)}" title="Clic para cambiar el estado" onclick="avanzarEstadoPedido('${p.id}')">${escapeHtml(p.estado)}</span></td>
        </tr>`;
    }).join('');
}

const CICLO_ESTADO = { nuevo: 'confirmado', confirmado: 'entregado', entregado: 'cancelado', cancelado: 'nuevo' };

window.avanzarEstadoPedido = async (id) => {
    const p = pedidos.find(x => x.id === id);
    if (!p) return;
    const nuevoEstado = CICLO_ESTADO[p.estado] || 'confirmado';
    try {
        const actualizado = await cambiarEstadoPedido(id, nuevoEstado);
        Object.assign(p, actualizado);
        renderizarPedidos();
        actualizarBadgePedidos();
    } catch (err) {
        toast('❌ No se pudo cambiar el estado: ' + (err.message || ''), 3500);
    }
};

let temporizadorPedidos = null;

function iniciarRealtimePedidos() {
    if (typeof suscribirseAPedidos !== 'function' || typeof _sb === 'undefined') return;
    if (canalPedidos) _sb.removeChannel(canalPedidos); // evita suscripciones duplicadas
    canalPedidos = suscribirseAPedidos((nuevo) => {
        pedidos.unshift(nuevo);
        renderizarPedidos();
        actualizarBadgePedidos();
        toast('🔔 ¡Pedido nuevo! $' + Number(nuevo.total || 0).toLocaleString('es-VE'), 4000);
    });
    // Respaldo: reconsulta la base cada 30s por si el canal en tiempo real
    // no llega (pestaña dormida, realtime desactivado, etc.). Garantiza que
    // todo pedido por WhatsApp termine apareciendo en el panel.
    clearInterval(temporizadorPedidos);
    temporizadorPedidos = setInterval(() => {
        if (document.getElementById('vista-dashboard').classList.contains('visible') &&
            !document.hidden) {
            cargarPedidos();
        }
    }, 30000);
}
