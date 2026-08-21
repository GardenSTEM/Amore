const WHATSAPP_NUMERO = "584126691482";

document.addEventListener('DOMContentLoaded', () => {
    actualizarNotificacionCarrito();
    moverInfoBar();
    rotarMasVendidos();

    const productosIndex = document.querySelectorAll('.product-card');
    productosIndex.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const nombre = card.querySelector('h3')?.innerText || "";
            const precio = card.querySelector('.price')?.innerText || "";
            const imagen = card.querySelector('img')?.src || "";
            
            let marca = "Amore Collection";
            const posibleMarca = card.querySelector('p:not(.price)');
            if (posibleMarca && posibleMarca.innerText !== nombre) {
                marca = posibleMarca.innerText;
            }

            abrirModalInteligente(nombre, marca, precio, imagen);
        });
    });

    function abrirModalInteligente(nombre, marca, precio, imagen) {
        const existing = document.getElementById('amore-modal-root');
        if (existing) existing.remove();

        const esArreglo = nombre.toLowerCase().includes('arreglo');

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
            .modal-img { width: 100%; height: 280px; object-fit: cover; display: block; }
            .modal-body { padding: 20px; }
            .modal-title { font-family: 'Playfair Display', serif; color: #5B4131; margin: 0; font-size: 1.5rem; }
            .modal-brand { color: #828282; font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; margin: 5px 0; }
            .modal-price { font-size: 1.5rem; font-weight: 700; color: #000; margin-bottom: 15px; }
            
            .qty-row { 
                display: ${esArreglo ? 'flex' : 'none'}; 
                align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; 
            }
            .qty-btn { width: 35px; height: 35px; border-radius: 50%; border: 1px solid #F3D4B9; background: #fff; cursor: pointer; font-size: 1.2rem; }
            
            .btn-amore {
                width: 90%; height: 48px; border-radius: 12px; border: none; margin: 5px auto;
                font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; color: #5B4131;
                transition: background-color 0.3s ease; /* Transición agregada */
            }
            .btn-cart { background: #F3D4B9; }
            .btn-cart:hover { background: #eec4a0; } /* Hover agregado */
            
            .btn-buy { background: #9ad0AD; }
            .btn-buy:hover { background: #8bc39e; } /* Hover agregado */
            
            .close-x { position: absolute; top: 10px; right: 10px; font-size: 26px; cursor: pointer; color: #5B4131; font-weight: bold; z-index: 10; width: 30px; height: 30px; line-height: 28px; }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'amore-modal-root';
        modal.innerHTML = `
            <div class="modal-card">
                <span class="close-x" id="close-modal">&times;</span>
                <img src="${imagen}" class="modal-img">
                <div class="modal-body">
                    <h2 class="modal-title">${nombre}</h2>
                    <p class="modal-brand">${marca}</p>
                    <div class="modal-price">${precio}</div>
                    
                    <div class="qty-row">
                        <button class="qty-btn" id="m-less">-</button>
                        <span id="m-qty" style="font-weight:700; font-size:1.2rem;">1</span>
                        <button class="qty-btn" id="m-more">+</button>
                    </div>
                    
                    <button class="btn-amore btn-cart" id="add-to-bag">Añadir a la Bolsa</button>
                    <button class="btn-amore btn-buy" id="buy-now">Comprar Ahora</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        let cant = 1;
        if(esArreglo) {
            document.getElementById('m-more').onclick = () => { cant++; document.getElementById('m-qty').innerText = cant; };
            document.getElementById('m-less').onclick = () => { if(cant > 1) { cant--; document.getElementById('m-qty').innerText = cant; }};
        }

        document.getElementById('close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target.id === 'amore-modal-root') modal.remove(); };

        document.getElementById('add-to-bag').onclick = () => {
            const cart = JSON.parse(localStorage.getItem('amore_carrito')) || [];
            cart.push({ nombre, marca, precio, cantidad: cant, imagen, tipo: esArreglo ? 'arreglo' : 'cartera' });
            localStorage.setItem('amore_carrito', JSON.stringify(cart));
            actualizarNotificacionCarrito();
            alert("✨ Añadido a la bolsa");
            modal.remove();
        };

        document.getElementById('buy-now').onclick = () => {
            const msg = `✨ *NUEVO PEDIDO AMORE* ✨\n\nHola, me interesa este producto:\n\n▪️ *${nombre}*\n▫️ Detalle: ${marca}\n▫️ Cantidad: ${cant}\n▫️ Precio: ${precio}\n\n📍 _Por favor indícame disponibilidad y pasos a seguir._`;
            window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }

    function actualizarNotificacionCarrito() {
        const carrito = JSON.parse(localStorage.getItem('amore_carrito')) || [];
        const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.innerText = total;
            badge.style.display = total > 0 ? 'flex' : 'none';
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
});