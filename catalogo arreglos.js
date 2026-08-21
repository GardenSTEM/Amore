const WHATSAPP_NUMERO = "584126691482";
const cap = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "";

document.addEventListener('DOMContentLoaded', () => {
    iniciarScrollRevealCatalogo(); // 👈 NUEVO: scroll reveal

    const buscador = document.querySelector('.search-box input') || document.querySelector('input[type="text"]');
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.product-card');
            cards.forEach(card => {
                const nombre = card.querySelector('h3').innerText.toLowerCase();
                const descripcion = card.querySelector('p').innerText.toLowerCase();
                if (nombre.includes(term) || descripcion.includes(term)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }
});

// --- FUNCIÓN PARA DAR FORMATO DE MILES ---
const formatearPrecio = (num) => {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/* =========================================================
   👇 APORTE NUEVO: Corrección de rutas de imágenes
   Algunas rutas tienen "2026110" en vez de "20260110"
   (les falta un 0). Esta función las limpia.
   ========================================================= */
function limpiarRutaImagen(ruta) {
    if (!ruta) return ruta;
    let limpia = ruta;
    // Corrige el patrón malformado común: 2026110 → 20260110
    limpia = limpia.replace(/2026110/g, '20260110');
    // Elimina dobles slashes accidentales (excepto el de http://)
    limpia = limpia.replace(/([^:]\/)\/+/g, "$1");
    return limpia;
}

/* =========================================================
   👇 APORTE NUEVO: Fallback robusto de imágenes
   Si la imagen principal falla, prueba variaciones
   ========================================================= */
function manejarErrorImagen(img, rutaOriginal) {
    const intentos = img.dataset.intentos || 0;
    if (intentos === 0) {
        // Primer intento: usar la ruta original sin limpiar
        img.dataset.intentos = 1;
        img.src = rutaOriginal;
    } else if (intentos === 1) {
        // Segundo intento: placeholder elegante
        img.dataset.intentos = 2;
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect fill="%23F3D4B9" width="300" height="300"/><text x="50%" y="50%" font-family="Playfair Display" font-size="20" fill="%235B4131" text-anchor="middle" dy=".3em">Amore</text></svg>';
    }
}

// --- FUNCIÓN PARA ORDENAR POR PRECIO ---
window.sortByPrice = function(order) {
    const grid = document.querySelector('.catalogo-grid');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.product-card'));
    cards.forEach(card => card.style.display = "block");
    cards.sort((a, b) => {
        const priceA = parseFloat(a.getAttribute('data-price'));
        const priceB = parseFloat(b.getAttribute('data-price'));
        return order === 'low' ? priceA - priceB : priceB - priceA;
    });
    grid.innerHTML = "";
    // 👈 MEJORA: animación escalonada al reordenar
    cards.forEach((card, i) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        grid.appendChild(card);
        setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, i * 60);
    });
};

// --- FUNCIÓN DEL MODAL DE PRODUCTO ---
let modalQty = 1;
window.openModal = function(nombre, detalle, precio, imagen) {
    const modalRoot = document.getElementById('amore-modal-root');
    if (!modalRoot) return;
    modalQty = 1;

    // 👇 MEJORA: limpiar la ruta de la imagen antes de usarla
    const rutaLimpia = limpiarRutaImagen(imagen);

    modalRoot.innerHTML = `
        <style>
            #amore-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
                display: flex; align-items: center; justify-content: center; z-index: 10000;
                padding: 10px;
                animation: amoreOverlayIn 0.3s ease;
            }
            @keyframes amoreOverlayIn { from { opacity: 0; } to { opacity: 1; } }
            .modal-card {
                background: #fff; width: 95%; max-width: 330px; border-radius: 18px;
                overflow: hidden; position: relative; text-align: center; padding-bottom: 20px;
                animation: scaleUp 0.3s ease; font-family: 'Lato', sans-serif;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .btn-cerrar {
                position: absolute; top: 10px; right: 10px; font-size: 26px;
                color: #5B4131; cursor: pointer; font-weight: bold; z-index: 10001;
                width: 30px; height: 30px; line-height: 28px;
                background: rgba(255,255,255,0.9); border-radius: 50%;
                transition: transform 0.2s ease, background 0.2s ease;
            }
            .btn-cerrar:hover { transform: rotate(90deg) scale(1.1); background: #fff; }
            .modal-img { 
                width: 100%; height: 300px; object-fit: cover; display: block; 
                background: #f9f9f9;
                transition: transform 0.4s ease;
            }
            .modal-img:hover { transform: scale(1.03); }
            .modal-body { padding: 5px 5px; justify-content: center; }
            .modal-price { font-size: 1.5rem; font-weight: 800; margin: 8px 0; color: #000; }
            .qty-selector {
                display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;
            }
            .qty-btn {
                width: 30px; height: 30px; border: 1px solid #F3D4B9; background: white;
                border-radius: 50%; cursor: pointer; font-weight: bold; color: #5B4131;
                transition: all 0.2s ease;
            }
            .qty-btn:hover { background: #F3D4B9; transform: scale(1.1); }
            .qty-btn:active { transform: scale(0.95); }
            .btn-amore {
                width: 92%; height: 45px; border-radius: 10px; border: none; margin: 8px auto;
                font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
                transition: all 0.3s ease;
                position: relative; overflow: hidden;
            }
            .btn-amore::before {
                content: ''; position: absolute; top: 0; left: -100%;
                width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                transition: left 0.5s ease;
            }
            .btn-amore:hover::before { left: 100%; }
            .btn-cart { background: #F3D4B9; color: #5B4131; }
            .btn-cart:hover { background: #eec4a0; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(243,212,185,0.5); }
            .btn-buy { background: #9ad0AD; color: #5B4131; }
            .btn-buy:hover { background: #8bc39e; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(154,208,173,0.5); }
        </style>
        <div id="amore-modal-overlay" onclick="if(event.target === this) closeAmoreModal()">
            <div class="modal-card">
                <span class="btn-cerrar" onclick="closeAmoreModal()">&times;</span>
                <img src="${rutaLimpia}" class="modal-img" 
                     onerror="manejarErrorImagen(this, '${imagen}')"
                     alt="${cap(nombre)}">
                <div class="modal-body">
                    <h2 style="margin:0; font-size: 1.3rem; font-family:'Playfair Display', serif; color: #5B4131;">${cap(nombre)}</h2>
                    <p style="color:#828282; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; margin: 5px 0;">${detalle}</p>
                    <div class="modal-price">${precio}</div>
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="updateModalQty(-1)">-</button>
                        <span id="modal-qty-val" style="font-weight:bold; font-size:1.1rem;">1</span>
                        <button class="qty-btn" onclick="updateModalQty(1)">+</button>
                    </div>
                    <button class="btn-amore btn-cart" onclick="addToBag('${nombre.replace(/'/g, "\\'")}', '${detalle.replace(/'/g, "\\'")}', '${precio}', '${rutaLimpia}')">
                        Añadir a la Bolsa
                    </button>
                    <button class="btn-amore btn-buy" onclick="buyNow('${nombre.replace(/'/g, "\\'")}', '${detalle.replace(/'/g, "\\'")}', '${precio}')">
                        Comprar Ahora
                    </button>
                </div>
            </div>
        </div>
    `;
    modalRoot.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.updateModalQty = (val) => {
    modalQty = Math.max(1, modalQty + val);
    const label = document.getElementById('modal-qty-val');
    if (label) {
        label.innerText = modalQty;
        // 👇 MEJORA: animación al cambiar cantidad
        label.style.transform = "scale(1.3)";
        setTimeout(() => { label.style.transform = "scale(1)"; }, 150);
    }
};

window.closeAmoreModal = () => {
    const modalRoot = document.getElementById('amore-modal-root');
    if (modalRoot) {
        modalRoot.style.display = 'none';
        modalRoot.innerHTML = '';
        document.body.style.overflow = 'auto';
    }
};

window.addToBag = (nombre, marca, precio, imagen) => {
    const cart = JSON.parse(localStorage.getItem('amore_carrito')) || [];
    const valorNumerico = parseFloat(precio.replace(/[^0-9.-]+/g, ""));
    cart.push({
        nombre,
        marca,
        precio: valorNumerico,
        cantidad: modalQty,
        imagen
    });
    localStorage.setItem('amore_carrito', JSON.stringify(cart));
    alert("✨ ¡Añadido con éxito!");
    closeAmoreModal();
    // 👇 MEJORA: shake del icono del carrito
    sacudirIconoCarrito();
};

window.buyNow = (nombre, detalle, precio) => {
    const mensaje = `✨ *NUEVO PEDIDO DE ARREGLO* ✨\n\nHola Amore, me gustaría comprar:\n\n▪️ *Producto:* ${nombre}\n▫️ Detalle: ${detalle}\n▫️ Cantidad: ${modalQty}\n▫️ Precio unitario: ${precio}`;
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
};

/* =========================================================
   👇 APORTE NUEVO: Scroll reveal para las tarjetas
   ========================================================= */
function iniciarScrollRevealCatalogo() {
    if (!document.getElementById('amore-catalog-reveal-style')) {
        const style = document.createElement('style');
        style.id = 'amore-catalog-reveal-style';
        style.innerHTML = `
            .amore-card-reveal {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            .amore-card-reveal.visible {
                opacity: 1;
                transform: translateY(0);
            }
            @media (prefers-reduced-motion: reduce) {
                .amore-card-reveal { opacity: 1; transform: none; transition: none; }
            }
        `;
        document.head.appendChild(style);
    }

    const cards = document.querySelectorAll('.product-card');
    if (cards.length === 0) return;

    cards.forEach((card, i) => {
        card.classList.add('amore-card-reveal');
        card.dataset.delay = i * 80;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    cards.forEach(card => observer.observe(card));
}

/* =========================================================
   👇 APORTE NUEVO: Shake del icono del carrito
   ========================================================= */
function sacudirIconoCarrito() {
    if (!document.getElementById('amore-shake-style')) {
        const style = document.createElement('style');
        style.id = 'amore-shake-style';
        style.innerHTML = `
            @keyframes amoreShake {
                0%, 100% { transform: rotate(0); }
                20% { transform: rotate(-15deg); }
                40% { transform: rotate(15deg); }
                60% { transform: rotate(-10deg); }
                80% { transform: rotate(10deg); }
            }
            .amore-shake { animation: amoreShake 0.6s ease; }
        `;
        document.head.appendChild(style);
    }
    const cartIcon = document.querySelector('.cart-icon') || document.querySelector('[aria-label="carrito"]');
    if (cartIcon) {
        cartIcon.classList.remove('amore-shake');
        void cartIcon.offsetWidth; // fuerza reflow para reiniciar animación
        cartIcon.classList.add('amore-shake');
    }
    // Actualizar badge si existe
    const carrito = JSON.parse(localStorage.getItem('amore_carrito')) || [];
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
        badge.style.transform = "scale(1.3)";
        setTimeout(() => { badge.style.transform = "scale(1)"; }, 200);
    }
}