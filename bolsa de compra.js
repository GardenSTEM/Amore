document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.querySelector('.cart-items');
    const totalLabel = document.querySelector('.cart-total .price');
    const checkoutBtn = document.querySelector('.btn-primary');
    const totalSection = document.querySelector('.cart-total');

    // Función para dar formato de miles con punto y decimales con coma
    const formatearPrecio = (num) => {
        return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const renderBag = () => {
        const cart = JSON.parse(localStorage.getItem('amore_carrito')) || [];
        if (cart.length === 0) {
            listContainer.innerHTML = "<p style='text-align:center; padding: 5vh 2vw; padding-top:20px'>Tu bolsa está vacía.</p>";
            if (totalLabel) totalLabel.innerText = "$0,00";
            if (totalSection) totalSection.style.display = "none";
            return;
        }
        if (totalSection) totalSection.style.display = "block";
        listContainer.innerHTML = "";
        let totalGeneral = 0;
        cart.forEach((item, i) => {
            const precioNumerico = parseFloat(item.precio) || 0;
            const subtotal = precioNumerico * item.cantidad;
            totalGeneral += subtotal;
            const article = document.createElement('article');
            article.className = 'cart-item';
            article.style = "display:flex; align-items:center; gap:20px; padding:20px 0; border-bottom:1px solid #f0f0f0;";
            article.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.imagen}" style="width:80px; height:80px; object-fit:cover; border-radius:12px; display:block;" alt="${item.nombre}">
                </div>
                <div style="flex:1;">
                    <h3 style="font-family:'Playfair Display', serif; margin:0; color:#5B4131; font-size:1.1rem;">${item.nombre}</h3>
                    <div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
                        <button onclick="changeQty(${i}, -1)" style="cursor:pointer; border:1px solid #F3D4B9; background:none; border-radius:4px; width:25px;">-</button>
                        <span style="font-weight:bold;">${item.cantidad}</span>
                        <button onclick="changeQty(${i}, 1)" style="cursor:pointer; border:1px solid #F3D4B9; background:none; border-radius:4px; width:25px;">+</button>
                    </div>
                </div>
                <div style="text-align:right;">
                    <p style="font-weight:700; margin:0; font-size:1.1rem;">$${formatearPrecio(subtotal)}</p>
                    <button onclick="removeItem(${i})" style="background:none; border:none; color:#828282; font-size:1.0rem; cursor:pointer; text-decoration:underline; margin-top:5px;">Quitar</button>
                </div>
            `;
            listContainer.appendChild(article);
        });
        if (totalLabel) totalLabel.innerText = `$${formatearPrecio(totalGeneral)}`;
        // El botón de compra se mantiene activo
        asignarEventoCompra();
        animarItemsCarrito(); // 👈 NUEVO: anima los items al renderizar
    };

    window.changeQty = (i, delta) => {
        const cart = JSON.parse(localStorage.getItem('amore_carrito'));
        if (cart && cart[i]) {
            cart[i].cantidad = Math.max(1, cart[i].cantidad + delta);
            localStorage.setItem('amore_carrito', JSON.stringify(cart));
            renderBag();
        }
    };

    window.removeItem = (i) => {
        const cart = JSON.parse(localStorage.getItem('amore_carrito'));
        if (cart) {
            cart.splice(i, 1);
            localStorage.setItem('amore_carrito', JSON.stringify(cart));
            renderBag();
        }
    };

    function asignarEventoCompra() {
        if (checkoutBtn) {
            checkoutBtn.onclick = () => {
                const cart = JSON.parse(localStorage.getItem('amore_carrito')) || [];
                if (cart.length === 0) return;
                let mensaje = "Hola, Amore Box. Un gusto saludarlos! Me gustaría hacerles un pedido de:\n\n";
                let totalFinal = 0;
                cart.forEach(it => {
                    const precioItem = parseFloat(it.precio) || 0;
                    const sub = precioItem * it.cantidad;
                    totalFinal += sub;
                    mensaje += `•${it.cantidad}x ${it.nombre} - $${formatearPrecio(sub)}\n`;
                });
                mensaje += `\n*Total: $${formatearPrecio(totalFinal)}*\n\n¿Me podrían confirmar la disponibilidad para concretar la compra?\n\nMil gracias!!`;
                window.open(`https://wa.me/584126691482?text=${encodeURIComponent(mensaje)}`, '_blank');
            };
        }
    }

    /* =========================================================
       👇 APORTE NUEVO: Animación de entrada escalonada
       Cada item del carrito aparece con fadeInUp con delay
       ========================================================= */
    function animarItemsCarrito() {
        // Inyectamos los estilos solo si no existen
        if (!document.getElementById('amore-cart-anim-style')) {
            const style = document.createElement('style');
            style.id = 'amore-cart-anim-style';
            style.innerHTML = `
                @keyframes amoreFadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .cart-item.amore-animated {
                    opacity: 0;
                    animation: amoreFadeInUp 0.5s ease forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .cart-item.amore-animated {
                        opacity: 1;
                        animation: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const items = document.querySelectorAll('.cart-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 100}ms`;
            item.classList.add('amore-animated');
        });
    }

    renderBag();
});