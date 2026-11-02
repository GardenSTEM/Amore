// =============================================================
//  AMOREBOX · CARRITO UI (badge + toast de confirmación)
//  Requerido en las 4 páginas públicas. Debe cargarse ANTES de
//  los scripts de página (script.js, catalogo *.js, bolsa).
//  La clave del carrito es 'amore_carrito' (igual que siempre).
// =============================================================

(function () {
    // Estilos del badge y del toast, inyectados una sola vez
    function inyectarEstilos() {
        if (document.getElementById('amore-carrito-ui-style')) return;
        const style = document.createElement('style');
        style.id = 'amore-carrito-ui-style';
        style.innerHTML = `
            /* ---------- BADGE DEL CARRITO ---------- */
            .cart-icon { position: relative; }
            .cart-count-badge {
                position: absolute;
                top: -6px;
                right: -8px;
                min-width: 18px;
                height: 18px;
                padding: 0 5px;
                border-radius: 9px;
                background: #C05C72;
                color: #fff;
                font-family: 'Lato', sans-serif;
                font-size: 0.68rem;
                font-weight: 700;
                line-height: 18px;
                text-align: center;
                display: none;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                z-index: 50;
                pointer-events: none;
            }
            @keyframes amoreBadgePop {
                0% { transform: scale(0.4); }
                60% { transform: scale(1.35); }
                100% { transform: scale(1); }
            }
            .cart-count-badge.amore-pop { animation: amoreBadgePop 0.35s ease; }

            /* ---------- TOAST DE CONFIRMACIÓN ---------- */
            #amore-toast {
                position: fixed;
                bottom: 28px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: #5B4131;
                color: #fff;
                font-family: 'Lato', sans-serif;
                font-size: 0.95rem;
                padding: 13px 26px;
                border-radius: 50px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.35);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease;
                z-index: 20000;
                max-width: 90vw;
                text-align: center;
            }
            #amore-toast.amore-toast-visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            @media (prefers-reduced-motion: reduce) {
                #amore-toast { transition: none; }
                .cart-count-badge.amore-pop { animation: none; }
            }
        `;
        document.head.appendChild(style);
    }

    // Badge dentro del ícono de la bolsa (lo crea si no existe)
    function asegurarBadge() {
        const cartIcon = document.querySelector('.cart-icon');
        if (!cartIcon) return null;
        let badge = cartIcon.querySelector('.cart-count-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-count-badge';
            badge.id = 'cart-count';
            cartIcon.appendChild(badge);
        }
        return badge;
    }

    // Toast (lo crea si no existe)
    function asegurarToast() {
        let toast = document.getElementById('amore-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'amore-toast';
            document.body.appendChild(toast);
        }
        return toast;
    }

    // Lee el carrito de localStorage
    function leerCarrito() {
        try { return JSON.parse(localStorage.getItem('amore_carrito')) || []; }
        catch (e) { return []; }
    }

    // Total de unidades en el carrito
    function totalUnidades() {
        return leerCarrito().reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
    }

    // Actualiza el badge visual con el total
    function actualizarNotificacionCarrito(pop) {
        const badge = asegurarBadge();
        if (!badge) return;
        const total = totalUnidades();
        badge.innerText = total > 99 ? '99+' : total;
        badge.style.display = total > 0 ? 'flex' : 'none';
        if (pop && total > 0) {
            badge.classList.remove('amore-pop');
            void badge.offsetWidth; // reinicia la animación
            badge.classList.add('amore-pop');
        }
    }

    // Muestra el toast elegante (reemplaza a los alert())
    function mostrarToast(mensaje, duracion = 2200) {
        const toast = asegurarToast();
        toast.textContent = mensaje;
        toast.classList.add('amore-toast-visible');
        clearTimeout(mostrarToast._timer);
        mostrarToast._timer = setTimeout(() => {
            toast.classList.remove('amore-toast-visible');
        }, duracion);
    }

    // Añade un producto respetando lo ya guardado (fusión por nombre)
    function agregarAlCarrito(producto) {
        const cart = leerCarrito();
        const existente = cart.find(it => it.nombre === producto.nombre);
        if (existente) {
            existente.cantidad += producto.cantidad || 1;
        } else {
            cart.push(producto);
        }
        localStorage.setItem('amore_carrito', JSON.stringify(cart));
        actualizarNotificacionCarrito(true);
        sacudirIconoCarrito();
    }

    // Shake del ícono de la bolsa (misma animación que ya usaban las páginas)
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
                .amore-shake { animation: amoreShake 0.6s ease; display: inline-flex; }
            `;
            document.head.appendChild(style);
        }
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.remove('amore-shake');
            void cartIcon.offsetWidth;
            cartIcon.classList.add('amore-shake');
        }
    }

    // Exponer API global para los scripts de página
    window.AmoreCarritoUI = {
        actualizar: actualizarNotificacionCarrito,
        toast: mostrarToast,
        agregar: agregarAlCarrito,
        total: totalUnidades
    };

    // Inicialización al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            inyectarEstilos();
            asegurarBadge();
            actualizarNotificacionCarrito(false);
        });
    } else {
        inyectarEstilos();
        asegurarBadge();
        actualizarNotificacionCarrito(false);
    }
})();
