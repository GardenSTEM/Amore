const WHATSAPP_NUMERO = "584126691482";

function limpiarRutaImagen(ruta) {
    if (!ruta) return ruta;
    let limpia = ruta.trim();
    limpia = limpia.replace(/2026110(?!\d)/g, '20260110');
    limpia = limpia.replace(/([^:])\/\//g, "$1/");
    return limpia;
}

function limpiarPrecio(precioTexto) {
    if (!precioTexto) return 0;
    const limpio = precioTexto.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(limpio) || 0;
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarNotificacionCarrito();
    moverInfoBar();
    rotarMasVendidos();
    inicializarNavegacionIndice(); // 👈 NUEVO: inicializa el menú hamburguesa

    // ===== MODAL PARA "LO MÁS VENDIDO" (.product-card) =====
    const productosIndex = document.querySelectorAll('.product-card');
    productosIndex.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const nombre = card.querySelector('h3')?.innerText || "";
            const precioTexto = card.querySelector('.price')?.innerText || "$0";
            const imagen = card.querySelector('img')?.src || "";
            const precioNumerico = limpiarPrecio(precioTexto);
            
            let marca = "Amore Collection";
            const posibleMarca = card.querySelector('p:not(.price)');
            if (posibleMarca && posibleMarca.innerText !== nombre) {
                marca = posibleMarca.innerText;
            }
            
            abrirModalInteligente(nombre, marca, precioTexto, precioNumerico, imagen);
        });
    });

    // ===== MODAL PARA "ARREGLOS DE TIENDA" (.tienda-fila) =====
    const arreglosTienda = document.querySelectorAll('.tienda-fila');
    arreglosTienda.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const nombre = card.querySelector('h3')?.innerText || "";
            const precioTexto = card.querySelector('.price')?.innerText || "$0";
            const imagen = card.querySelector('img')?.src || "";
            const precioNumerico = limpiarPrecio(precioTexto);
            const marca = "Arreglo de tienda";
            
            abrirModalInteligente(nombre, marca, precioTexto, precioNumerico, imagen);
        });
    });

    function abrirModalInteligente(nombre, marca, precioTexto, precioNumerico, imagen) {
        const existing = document.getElementById('amore-modal-root');
        if (existing) existing.remove();

        const style = document.createElement("style");
        style.innerText = `
            #amore-modal-root {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000; font-family: 'Lato', sans-serif;
            }
            .modal-card {
                background: #fff; width: 320px; border-radius: 20px;
                overflow: hidden; position: relative; text-align: center;
                padding-bottom: 25px; animation: modalPop 0.3s ease-out;
            }
            @keyframes modalPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            .modal-img { width: 100%; height: 280px; object-fit: cover; display: block; background: #f9f9f9; }
            .modal-body { padding: 20px; }
            .modal-title { font-family: 'Playfair Display', serif; color: #5B4131; margin: 0; font-size: 1.5rem; }
            .modal-brand { color: #828282; font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; margin: 5px 0; }
            .modal-price { font-size: 1.5rem; font-weight: 700; color: #000; margin-bottom: 15px; }
            .btn-amore {
                width: 90%; height: 48px; border-radius: 12px; border: none; margin: 5px auto;
                font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; color: #5B4131;
                transition: background-color 0.3s ease;
            }
            .btn-cart { background: #F3D4B9; }
            .btn-cart:hover { background: #eec4a0; }
            .btn-buy { background: #9ad0AD; }
            .btn-buy:hover { background: #8bc39e; }
            .close-x { position: absolute; top: 10px; right: 10px; font-size: 26px; cursor: pointer; color: #5B4131; font-weight: bold; z-index: 10; width: 30px; height: 30px; line-height: 28px; background: rgba(255,255,255,0.9); border-radius: 50%; }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'amore-modal-root';
        
        const imagenLimpia = limpiarRutaImagen(imagen);
        
        modal.innerHTML = `
            <div class="modal-card">
                <span class="close-x" id="close-modal">&times;</span>
                <img src="${imagenLimpia}" class="modal-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22><rect fill=%22%23F3D4B9%22 width=%22300%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 font-family=%22Playfair Display%22 font-size=%2220%22 fill=%22%235B4131%22 text-anchor=%22middle%22 dy=%22.3em%22>Amore</text></svg>'">
                <div class="modal-body">
                    <h2 class="modal-title">${nombre}</h2>
                    <p class="modal-brand">${marca}</p>
                    <div class="modal-price">${precioTexto}</div>
                    <button class="btn-amore btn-cart" id="add-to-bag">Añadir a la Bolsa</button>
                    <button class="btn-amore btn-buy" id="buy-now">Comprar Ahora</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target.id === 'amore-modal-root') modal.remove(); };

        document.getElementById('add-to-bag').onclick = () => {
            const cart = JSON.parse(localStorage.getItem('amore_carrito')) || [];
            
            const existente = cart.find(item => item.nombre === nombre);
            if (existente) {
                existente.cantidad += 1;
            } else {
                cart.push({ 
                    nombre, 
                    marca, 
                    precio: precioNumerico,
                    cantidad: 1, 
                    imagen: imagenLimpia, 
                    tipo: 'producto' 
                });
            }
            
            localStorage.setItem('amore_carrito', JSON.stringify(cart));
            actualizarNotificacionCarrito();
            mostrarNotificacionIndex("✨ ¡Añadido a la bolsa!");
            modal.remove();
        };

        document.getElementById('buy-now').onclick = () => {
            const msg = `*NUEVO PEDIDO AMORE*\n\nHola, feliz día! Me interesa este producto:\n\n▪️ *${nombre}*\n▫️ Marca: ${marca}\n▫️ Cantidad: 1\n▫️ Precio: ${precioTexto}\n\n📍 _Por favor, podría indicarme disponibilidad._`;
            window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }

    function mostrarNotificacionIndex(mensaje) {
        const notif = document.createElement('div');
        notif.innerText = mensaje;
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #9ad0AD; color: #5B4131;
            padding: 15px 25px; border-radius: 10px; font-family: 'Playfair Display', serif;
            font-weight: 700; box-shadow: 0 8px 20px rgba(0,0,0,0.2); z-index: 100001;
            animation: slideIn 0.4s ease;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2500);
    }

    function actualizarNotificacionCarrito() {
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

    function moverInfoBar() {
        const cinta = document.getElementById('info-bar');
        if (!cinta || window.innerWidth > 768) return;
        cinta.innerHTML += cinta.innerHTML + cinta.innerHTML;
        let x = 0;
        function animar() {
            x -= 1;
            if (Math.abs(x) >= cinta.scrollWidth / 3) x = 0;
            cinta.style.transform = `translateX(${x}px)`;
            requestAnimationFrame(animar);
        }
        animar();
    }

    function rotarMasVendidos() {
        const grid = document.querySelector('.mas-vendidos-grid');
        if (!grid) return;
        grid.style.transition = "opacity 0.5s ease";
        setInterval(() => {
            grid.style.opacity = "0";
            setTimeout(() => {
                const items = Array.from(grid.children);
                items.sort(() => Math.random() - 0.5);
                grid.innerHTML = '';
                items.forEach(i => grid.appendChild(i));
                grid.style.opacity = "1";
            }, 500);
        }, 20000);
    }

    // ===== NAVEGACIÓN ÍNDICE - MENÚ HAMBURGUESA =====
    function inicializarNavegacionIndice() {
        const menuToggle = document.getElementById('menu-toggle');
        const navIndice = document.getElementById('nav-indice');
        const navLinks = document.querySelectorAll('.nav-indice a');

        if (!menuToggle || !navIndice) {
            console.log('Menú hamburguesa no encontrado en el HTML');
            return;
        }

        // Crear overlay dinámicamente
        let overlay = document.querySelector('.nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            document.body.appendChild(overlay);
        }

        // Toggle del menú al hacer click en el botón hamburguesa
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuToggle.classList.toggle('active');
            navIndice.classList.toggle('open');
            overlay.classList.toggle('show');
        });

        // Cerrar menú Y navegar a la sección al hacer click en un enlace
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        
        // 1. Cerrar menú inmediatamente
        menuToggle.classList.remove('active');
        navIndice.classList.remove('open');
        overlay.classList.remove('show');
        
        // 2. Navegar a la sección
        if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Esperamos a que el menú termine de cerrarse
                // transition: right 0.4s ease → 400ms)
                setTimeout(() => {
                    // Usamos scrollIntoView: el navegador usará automáticamente
                    // el scroll-padding-top: 100px que ya tienes en tu CSS
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 420); // Un poquito más que la animación del menú (400ms)
            }
        }
    });
});

        // Cerrar menú al hacer click en el overlay
        overlay.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navIndice.classList.remove('open');
            overlay.classList.remove('show');
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (navIndice.classList.contains('open') && 
                !navIndice.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navIndice.classList.remove('open');
                overlay.classList.remove('show');
            }
        });

        // Resaltar sección activa al hacer scroll
        const secciones = document.querySelectorAll('section[id]');

        function resaltarSeccionActiva() {
            const scrollY = window.scrollY + 150;
            
            secciones.forEach(seccion => {
                const seccionTop = seccion.offsetTop;
                const seccionHeight = seccion.offsetHeight;
                const seccionId = seccion.getAttribute('id');
                
                if (scrollY >= seccionTop && scrollY < seccionTop + seccionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${seccionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }

        window.addEventListener('scroll', resaltarSeccionActiva);
        resaltarSeccionActiva();
    }
});