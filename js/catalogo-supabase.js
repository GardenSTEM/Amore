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
        let productos = [];
        if (esIndex) {
            productos = await obtenerDestacados(6);
            if (!productos.length) productos = (await obtenerProductos(null)).slice(0, 6);
            renderizarIndex(productos);
        } else {
            productos = await obtenerProductos(categoria);
            renderizarCatalogo(grid, productos);
        }

        // ---- TIEMPO REAL: refrescar cuando el admin cambie algo ----
        suscribirseAProductos(async () => {
            if (esIndex) {
                let dest = await obtenerDestacados(6);
                if (!dest.length) dest = (await obtenerProductos(null)).slice(0, 6);
                renderizarIndex(dest);
            } else {
                renderizarCatalogo(grid, await obtenerProductos(categoria));
            }
        });
    } catch (err) {
        console.error('[Amorebox] Falló la carga dinámica del catálogo.', err);
        mostrarEstadoCatalogo(contenedor, 'No se pudieron cargar los productos. Inténtalo más tarde.');
    }
});

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

