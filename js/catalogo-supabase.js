// =============================================================
//  AMOREBOX · CATÁLOGO DINÁMICO
//  Renderiza las tarjetas desde Supabase y se mantiene al día en
//  tiempo real (Realtime). Si Supabase no está configurado o falla,
//  el HTML estático original sigue visible sin cambios.
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const esIndex = !document.querySelector('.catalogo-grid');
    const grid = document.querySelector('.catalogo-grid');
    const contenedor = esIndex ? document.querySelector('.products-grid') : grid;

    // Categoría según la página: catálogo carteras / catálogo arreglos / index
    let categoria = null;
    if (grid && location.pathname.toLowerCase().includes('carteras')) categoria = 'cartera';
    else if (grid) categoria = 'arreglo';

    mostrarEstadoCatalogo(contenedor, 'Cargando productos...');

    if (typeof _sb === 'undefined') {
        console.error('[Amorebox] Supabase no está configurado; no se muestran imágenes locales.');
        mostrarEstadoCatalogo(contenedor, 'No se pudo conectar con el catálogo. Inténtalo más tarde.');
        return;
    }

    try {
        if (esIndex) {
            await cargarSeccionesIndex();
        } else {
            renderizarCatalogo(grid, await obtenerProductos(categoria));
        }

        // ---- TIEMPO REAL: refrescar cuando el admin cambie algo ----
        suscribirseAProductos(async () => {
            if (esIndex) {
                await cargarSeccionesIndex();
            } else {
                renderizarCatalogo(grid, await obtenerProductos(categoria));
            }
        });
    } catch (err) {
        console.error('[Amorebox] Falló la carga dinámica del catálogo.', err);
        mostrarEstadoCatalogo(contenedor, 'No se pudieron cargar los productos. Inténtalo más tarde.');
    }
});

// Carga (y refresca) las dos secciones dinámicas del index:
// "Lo más vendido" y "Arreglos de tienda".
async function cargarSeccionesIndex() {
    let productos = await obtenerDestacados(6);
    if (!productos.length) productos = (await obtenerProductos(null)).slice(0, 6);
    renderizarIndex(productos);

    try {
        renderizarArreglosTienda(await obtenerArreglosTienda());
    } catch (err) {
        // Si la columna `en_tienda` todavía no existe en la BD, se conserva
        // el HTML estático de la sección como respaldo.
        console.warn('[Amorebox] No se pudieron cargar los arreglos de tienda:', err.message);
    }
}

function mostrarEstadoCatalogo(contenedor, mensaje) {
    if (!contenedor) return;
    contenedor.replaceChildren();
    const estado = document.createElement('p');
    estado.className = 'catalogo-estado';
    estado.textContent = mensaje;
    contenedor.appendChild(estado);
}

/* ---------------------- PÁGINAS DE CATÁLOGO ----------------- */

function renderizarCatalogo(grid, productos) {
    if (!grid) return;
    grid.replaceChildren();
    if (!productos.length) {
        mostrarEstadoCatalogo(grid, 'No hay productos disponibles en este catálogo.');
        return;
    }
    const frag = document.createDocumentFragment();
    productos.forEach(p => frag.appendChild(crearTarjetaProducto(p)));
    grid.appendChild(frag);

    // Reactivar el reveal animado de los scripts de catálogo
    if (typeof iniciarScrollRevealCatalogo === 'function') {
        cardsReiniciar(grid);
    }
}

// Reaplica la animación de aparición a las nuevas tarjetas
function cardsReiniciar(grid) {
    const cards = grid.querySelectorAll('.product-card');
    if (!cards.length) return;
    cards.forEach((card, i) => {
        card.classList.add('amore-card-reveal');
        card.dataset.delay = i * 60;
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), entry.target.dataset.delay || 0);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    cards.forEach(card => observer.observe(card));
}

/* ------------------------ INDEX ----------------------------- */

function renderizarIndex(productos) {
    const contenedor = document.querySelector('.products-grid');
    if (!contenedor) return;

    contenedor.replaceChildren();
    if (!productos.length) {
        mostrarEstadoCatalogo(contenedor, 'No hay productos disponibles en este momento.');
        return;
    }
    const frag = document.createDocumentFragment();
    productos.forEach(p => {
        const card = crearTarjetaProducto(p);
        // En el index el modal se abre vía script.js (listener por tarjeta),
        // así que aquí solo construimos la misma estructura visual.
        card.removeAttribute('onclick');
        card.style.cursor = 'pointer';
        frag.appendChild(card);
    });
    contenedor.appendChild(frag);

    // Reconectar el modal del index a las nuevas tarjetas (mismo flujo de script.js)
    contenedor.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const nombre = card.querySelector('h3')?.innerText || '';
            const precio = card.querySelector('.price')?.innerText || '';
            const imagen = card.querySelector('img')?.src || '';
            const posibleMarca = card.querySelector('p:not(.price)');
            const marca = posibleMarca && posibleMarca.innerText !== nombre ? posibleMarca.innerText : 'Amore Collection';
            const categoria = card.dataset.categoria || '';   // ← categoría REAL de la BD
            const stock = card.dataset.stock ?? '';
            if (typeof window.abrirModalInteligente === 'function') {
                window.abrirModalInteligente(nombre, marca, precio, limpiarPrecio(precio), imagen, categoria, stock);
            }
        });
    });
}

/* ------------------- ARREGLOS DE TIENDA (INDEX) ---------------- */

function renderizarArreglosTienda(productos) {
    const contenedor = document.querySelector('.tienda-filas');
    if (!contenedor) return;

    contenedor.replaceChildren();
    if (!productos.length) {
        const vacio = document.createElement('p');
        vacio.className = 'arreglos-tienda-vacio';
        vacio.textContent = 'No hay arreglos de tienda disponibles en este momento.';
        contenedor.appendChild(vacio);
        return;
    }

    const frag = document.createDocumentFragment();
    productos.forEach(p => frag.appendChild(crearFilaTienda(p)));
    contenedor.appendChild(frag);
}

// Misma estructura que el HTML estático: .tienda-fila > imagen + info
function crearFilaTienda(p) {
    const fila = document.createElement('div');
    fila.className = 'tienda-fila';
    fila.setAttribute('data-price', p.precio ?? '');
    fila.dataset.id = p.id || '';

    const imagenWrap = document.createElement('div');
    imagenWrap.className = 'tienda-fila-imagen';

    const img = document.createElement('img');
    const ruta = (typeof limpiarRutaImagen === 'function') ? limpiarRutaImagen(p.imagen_url) : p.imagen_url;
    const rutaOriginal = p.imagen_url || '';
    if (ruta && ruta.includes('/image/upload/')) {
        img.src = urlImagenCloudinary(ruta, 480);
        img.srcset = [
            `${urlImagenCloudinary(ruta, 300)} 300w`,
            `${urlImagenCloudinary(ruta, 480)} 480w`,
            `${urlImagenCloudinary(ruta, 900)} 900w`
        ].join(', ');
        img.sizes = '(max-width: 768px) 45vw, 160px';
    } else {
        img.src = ruta || '';
    }
    img.alt = p.nombre || '';
    img.width = 480;
    img.height = 640;
    img.loading = 'lazy';
    img.decoding = 'async';
    imagenWrap.appendChild(img);

    const info = document.createElement('div');
    info.className = 'tienda-fila-info';
    const h3 = document.createElement('h3');
    h3.textContent = p.nombre || '';
    const precio = document.createElement('span');
    precio.className = 'price';
    precio.textContent = formatearPrecioAmore(p.precio);
    info.appendChild(h3);
    info.appendChild(precio);

    fila.appendChild(imagenWrap);
    fila.appendChild(info);

    fila.addEventListener('click', () => {
        if (typeof window.abrirModalInteligente === 'function') {
            window.abrirModalInteligente(
                p.nombre || '',
                'Arreglo de tienda',
                formatearPrecioAmore(p.precio),
                Number(p.precio) || 0,
                rutaOriginal
            );
        }
    });

    return fila;
}

