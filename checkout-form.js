/* ============================================================
   CHECKOUT FORM - AMORE BOX
   ============================================================ */

const WHATSAPP_CHECKOUT = "584126691482";

/* ============================================================
   1. DETECCIÓN DE TIPOS DE PRODUCTOS
   ============================================================ */
function clasificarProductos(lista) {
    const resultado = {
        catalogos: [],   // Arreglos de catálogo (más vendidos)
        tiendas: [],     // Arreglos de tienda
        carteras: [],    // Carteras
        total: 0
    };
    
    lista.forEach(item => {
        const precio = parseFloat(item.precio) || 0;
        const subtotal = precio * (item.cantidad || 1);
        resultado.total += subtotal;
        
        const producto = {
            nombre: item.nombre,
            marca: item.marca,
            precio: precio,
            cantidad: item.cantidad || 1,
            subtotal: subtotal,
            imagen: item.imagen,
            tipo: item.tipo
        };
        
        if (item.tipo === 'cartera') {
            resultado.carteras.push(producto);
        } else if (item.marca === 'Arreglo de tienda') {
            resultado.tiendas.push(producto);
        } else {
            resultado.catalogos.push(producto);
        }
    });
    
    return resultado;
}

/* ============================================================
   2. FUNCIÓN PRINCIPAL - DETECTA CONTEXTO Y ABRE FORMULARIO
   ============================================================ */
window.abrirFormularioCompra = function(contexto) {
    let productos = [];
    
    if (contexto.tipo === 'directa') {
        // Compra directa desde un modal (un solo producto)
        productos = [{
            nombre: contexto.producto.nombre,
            marca: contexto.producto.marca,
            precio: contexto.producto.precio,
            cantidad: 1,
            imagen: contexto.producto.imagen,
            tipo: contexto.producto.tipo
        }];
    } else if (contexto.tipo === 'bolsa') {
        // Compra desde la bolsa de compra
        productos = JSON.parse(localStorage.getItem('amore_carrito')) || [];
        if (productos.length === 0) {
            alert('Tu bolsa está vacía');
            return;
        }
    }
    
    const clasificacion = clasificarProductos(productos);
    inyectarEstilosCheckout();
    construirYMostrarFormulario(clasificacion, productos);
};

/* ============================================================
   3. INYECCIÓN DE ESTILOS CSS
   ============================================================ */
function inyectarEstilosCheckout() {
    if (document.getElementById('amore-checkout-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'amore-checkout-styles';
    style.innerHTML = `
        /* ===== OVERLAY ===== */
        #amore-checkout-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 100000; padding: 15px;
            animation: amoreOverlayFade 0.3s ease;
        }
        @keyframes amoreOverlayFade { from { opacity: 0; } to { opacity: 1; } }
        
        /* ===== CONTENEDOR PRINCIPAL ===== */
        .amore-checkout-card {
            background: #fff; width: 100%; max-width: 500px;
            max-height: 90vh; overflow-y: auto;
            border-radius: 20px; position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
            animation: amoreCardPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: 'Lato', sans-serif;
        }
        @keyframes amoreCardPop {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .amore-checkout-card::-webkit-scrollbar { width: 6px; }
        .amore-checkout-card::-webkit-scrollbar-track { background: #f5f5f5; }
        .amore-checkout-card::-webkit-scrollbar-thumb { background: #F3D4B9; border-radius: 3px; }
        
        /* ===== HEADER DEL FORMULARIO ===== */
        .checkout-header {
            background: linear-gradient(135deg, #F3D4B9 0%, #f8bd79 100%);
            padding: 25px 25px 20px;
            border-radius: 20px 20px 0 0;
            position: relative;
            text-align: center;
        }
        .checkout-header h2 {
            font-family: 'Playfair Display', serif;
            color: #5B4131; margin: 0; font-size: 1.6rem;
            font-weight: 700;
        }
        .checkout-header p {
            color: #5B4131; margin: 5px 0 0; font-size: 0.85rem;
            opacity: 0.8;
        }
        .checkout-close {
            position: absolute; top: 15px; right: 15px;
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(255,255,255,0.9); border: none;
            color: #5B4131; font-size: 22px; font-weight: bold;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; transition: all 0.2s ease;
            line-height: 1;
        }
        .checkout-close:hover {
            transform: rotate(90deg) scale(1.1);
            background: #fff;
        }
        
        /* ===== CUERPO DEL FORMULARIO ===== */
        .checkout-body { padding: 20px 25px 25px; }
        
        /* ===== SECCIONES ===== */
        .checkout-section {
            margin-bottom: 20px;
            padding-bottom: 18px;
            border-bottom: 1px solid rgba(91,65,49,0.08);
        }
        .checkout-section:last-child { border-bottom: none; }
        .checkout-section-title {
            font-family: 'Playfair Display', serif;
            color: #5B4131; font-size: 1rem; font-weight: 700;
            margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;
        }
        .checkout-section-title::before {
            content: ''; width: 4px; height: 18px;
            background: #9ad0AD; border-radius: 2px;
        }
        
        /* ===== LISTA DE PRODUCTOS ===== */
        .checkout-products {
            background: rgba(243, 212, 185, 0.15);
            border-radius: 10px; padding: 12px;
            max-height: 180px; overflow-y: auto;
        }
        .checkout-product-item {
            display: flex; justify-content: space-between;
            align-items: center; padding: 6px 0;
            font-size: 0.9rem; color: #5B4131;
        }
        .checkout-product-item:not(:last-child) {
            border-bottom: 1px dashed rgba(91,65,49,0.15);
        }
        .checkout-product-name { flex: 1; font-weight: 600; }
        .checkout-product-qty {
            background: #F3D4B9; color: #5B4131;
            padding: 2px 8px; border-radius: 10px;
            font-size: 0.75rem; font-weight: 700;
            margin: 0 8px;
        }
        .checkout-product-price { font-weight: 700; color: #000; }
        .checkout-total-row {
            display: flex; justify-content: space-between;
            align-items: center; padding: 10px 0 0;
            margin-top: 8px; border-top: 2px solid #5B4131;
            font-family: 'Playfair Display', serif;
            font-weight: 700; color: #5B4131; font-size: 1.1rem;
        }
        
        /* ===== INPUTS ===== */
        .checkout-input, .checkout-textarea, .checkout-select {
            width: 100%; padding: 12px 14px;
            border: 2px solid rgba(91,65,49,0.15);
            border-radius: 10px; font-family: 'Lato', sans-serif;
            font-size: 0.95rem; color: #5B4131;
            background: #fff; transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .checkout-input:focus, .checkout-textarea:focus, .checkout-select:focus {
            outline: none; border-color: #f8bd79;
            box-shadow: 0 0 0 3px rgba(248,189,121,0.2);
        }
        .checkout-textarea {
            resize: vertical; min-height: 90px;
            font-family: 'Lato', sans-serif;
        }
        .checkout-label {
            display: block; font-size: 0.85rem;
            color: #5B4131; font-weight: 700;
            margin-bottom: 6px;
            font-family: 'Playfair Display', serif;
        }
        .checkout-char-counter {
            text-align: right; font-size: 0.75rem;
            color: #828282; margin-top: 4px;
        }
        .checkout-char-counter.warning { color: #e67e22; font-weight: 700; }
        .checkout-char-counter.error { color: #c0392b; font-weight: 700; }
        
        /* ===== RADIO BUTTONS PERSONALIZADOS ===== */
        .checkout-radio-group {
            display: flex; flex-direction: column; gap: 8px;
        }
        .checkout-radio-option {
            display: flex; align-items: center; gap: 10px;
            padding: 12px 14px; border: 2px solid rgba(91,65,49,0.15);
            border-radius: 10px; cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem; color: #5B4131;
        }
        .checkout-radio-option:hover {
            border-color: #F3D4B9;
            background: rgba(243,212,185,0.1);
        }
        .checkout-radio-option.selected {
            border-color: #9ad0AD;
            background: rgba(154,208,173,0.1);
            font-weight: 700;
        }
        .checkout-radio-option input[type="radio"] {
            accent-color: #5B4131;
            width: 16px; height: 16px;
            cursor: pointer;
        }
        
        /* ===== BOTÓN GPS ===== */
        .checkout-btn-gps {
            width: 100%; padding: 10px;
            background: #5B4131; color: #fff;
            border: none; border-radius: 8px;
            font-family: 'Playfair Display', serif;
            font-weight: 700; cursor: pointer;
            margin-top: 10px; transition: all 0.3s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .checkout-btn-gps:hover {
            background: #3d2b20;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(91,65,49,0.3);
        }
        .checkout-btn-gps:disabled {
            background: #828282; cursor: not-allowed;
            transform: none;
        }
        .checkout-gps-status {
            font-size: 0.8rem; color: #828282;
            margin-top: 6px; font-style: italic;
        }
        .checkout-gps-status.success { color: #27ae60; font-weight: 700; }
        .checkout-gps-status.error { color: #c0392b; }
        
        /* ===== BOTÓN ENVIAR ===== */
        .checkout-btn-submit {
            width: 100%; padding: 16px;
            background: #9ad0AD; color: #5B4131;
            border: none; border-radius: 12px;
            font-family: 'Playfair Display', serif;
            font-size: 1.15rem; font-weight: 700;
            cursor: pointer; margin-top: 10px;
            transition: all 0.3s ease;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            position: relative; overflow: hidden;
        }
        .checkout-btn-submit::before {
            content: ''; position: absolute; top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: left 0.5s ease;
        }
        .checkout-btn-submit:hover::before { left: 100%; }
        .checkout-btn-submit:hover {
            background: #8bc39e;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(154,208,173,0.4);
        }
        
        /* ===== ALERTA ===== */
        .checkout-alert {
            background: rgba(248,189,121,0.2);
            border-left: 3px solid #f8bd79;
            padding: 10px 14px; border-radius: 6px;
            font-size: 0.85rem; color: #5B4131;
            margin-bottom: 15px;
        }
        
        /* ===== RESPONSIVE ===== */
        @media (max-width: 600px) {
            .amore-checkout-card { max-width: 100%; border-radius: 15px; }
            .checkout-header { padding: 20px 18px 15px; }
            .checkout-header h2 { font-size: 1.3rem; }
            .checkout-body { padding: 15px 18px 20px; }
            .checkout-radio-option { padding: 10px 12px; font-size: 0.85rem; }
        }
    `;
    document.head.appendChild(style);
}

/* ============================================================
   4. CONSTRUCCIÓN DEL FORMULARIO
   ============================================================ */
function construirYMostrarFormulario(clasificacion, productosOriginales) {
    const overlay = document.createElement('div');
    overlay.id = 'amore-checkout-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) cerrarCheckout(); };
    
    // Determinar qué campos mostrar según el contenido
    const tieneCatalogo = clasificacion.catalogos.length > 0;
    const tieneTienda = clasificacion.tiendas.length > 0;
    const tieneCarteras = clasificacion.carteras.length > 0;
    const esMixto = (tieneCatalogo ? 1 : 0) + (tieneTienda ? 1 : 0) + (tieneCarteras ? 1 : 0) > 1;
    
    let formularioHTML = '';
    
    // ===== SECCIÓN 1: DATOS DEL CLIENTE =====
    formularioHTML += `
        <div class="checkout-section">
            <h3 class="checkout-section-title">Tus datos</h3>
            <label class="checkout-label" for="chk-nombre">Nombre completo *</label>
            <input type="text" id="chk-nombre" class="checkout-input" 
                   placeholder="Ej: María Pérez" required>
        </div>
    `;
    
    // ===== SECCIÓN 2: PRODUCTOS =====
    formularioHTML += `
        <div class="checkout-section">
            <h3 class="checkout-section-title">Tu pedido</h3>
            <div class="checkout-products">
    `;
    
    // Mostrar productos agrupados por tipo si es mixto
    if (esMixto) {
        if (tieneCatalogo) {
            formularioHTML += `<div style="font-size:0.75rem; color:#828282; text-transform:uppercase; margin-bottom:4px; font-weight:700;">🌸 Arreglos del catálogo</div>`;
            clasificacion.catalogos.forEach(p => {
                formularioHTML += productoItemHTML(p);
            });
        }
        if (tieneTienda) {
            formularioHTML += `<div style="font-size:0.75rem; color:#828282; text-transform:uppercase; margin:8px 0 4px; font-weight:700;">🏪 Arreglos de tienda</div>`;
            clasificacion.tiendas.forEach(p => {
                formularioHTML += productoItemHTML(p);
            });
        }
        if (tieneCarteras) {
            formularioHTML += `<div style="font-size:0.75rem; color:#828282; text-transform:uppercase; margin:8px 0 4px; font-weight:700;">👜 Carteras</div>`;
            clasificacion.carteras.forEach(p => {
                formularioHTML += productoItemHTML(p);
            });
        }
    } else {
        productosOriginales.forEach(p => {
            const prod = { ...p, subtotal: (parseFloat(p.precio) || 0) * (p.cantidad || 1) };
            formularioHTML += productoItemHTML(prod);
        });
    }
    
    formularioHTML += `
                <div class="checkout-total-row">
                    <span>Total</span>
                    <span>$${formatearPrecioCheckout(clasificacion.total)}</span>
                </div>
            </div>
        </div>
    `;
    
    // ===== SECCIÓN 3: DEDICATORIAS =====
    // Caso 1: Solo arreglos de catálogo → 1 dedicatoria de 200 palabras
    if (tieneCatalogo && !tieneTienda && !esMixto) {
        formularioHTML += dedicatoriaHTML('catalogo', 200);
    }
    // Caso 2: Solo arreglos de tienda → pregunta si quiere dedicatoria (100 palabras)
    else if (tieneTienda && !tieneCatalogo && !esMixto) {
        formularioHTML += `
            <div class="checkout-section">
                <h3 class="checkout-section-title">Tarjeta dedicatoria</h3>
                <div class="checkout-radio-group">
                    <label class="checkout-radio-option">
                        <input type="radio" name="chk-dedicatoria-tienda" value="si" onchange="toggleDedicatoriaTienda()">
                        <span>Sí, deseo incluir tarjeta dedicatoria</span>
                    </label>
                    <label class="checkout-radio-option">
                        <input type="radio" name="chk-dedicatoria-tienda" value="no" checked onchange="toggleDedicatoriaTienda()">
                        <span>No, gracias</span>
                    </label>
                </div>
                <div id="chk-dedicatoria-tienda-container" style="display:none; margin-top:12px;">
                    <label class="checkout-label" for="chk-nota-tienda">Mensaje para la tarjeta (máx. 100 palabras)</label>
                    <textarea id="chk-nota-tienda" class="checkout-textarea" 
                              placeholder="Escribe tu mensaje con cariño..."
                              oninput="contarPalabras(this, 100, 'counter-tienda')"></textarea>
                    <div id="counter-tienda" class="checkout-char-counter">0 / 100 palabras</div>
                </div>
            </div>
        `;
    }
    // Caso mixto: dedicatorias separadas
    else if (esMixto) {
        if (tieneCatalogo) {
            formularioHTML += dedicatoriaHTML('catalogo', 200);
        }
        if (tieneTienda) {
            formularioHTML += `
                <div class="checkout-section">
                    <h3 class="checkout-section-title">Dedicatoria - Arreglo de tienda</h3>
                    <div class="checkout-radio-group">
                        <label class="checkout-radio-option">
                            <input type="radio" name="chk-dedicatoria-tienda-mix" value="si" onchange="toggleDedicatoriaTiendaMix()">
                            <span>Sí, deseo incluir tarjeta</span>
                        </label>
                        <label class="checkout-radio-option">
                            <input type="radio" name="chk-dedicatoria-tienda-mix" value="no" checked onchange="toggleDedicatoriaTiendaMix()">
                            <span>No, gracias</span>
                        </label>
                    </div>
                    <div id="chk-dedicatoria-tienda-mix-container" style="display:none; margin-top:12px;">
                        <label class="checkout-label" for="chk-nota-tienda-mix">Mensaje (máx. 100 palabras)</label>
                        <textarea id="chk-nota-tienda-mix" class="checkout-textarea"
                                  placeholder="Escribe tu mensaje..."
                                  oninput="contarPalabras(this, 100, 'counter-tienda-mix')"></textarea>
                        <div id="counter-tienda-mix" class="checkout-char-counter">0 / 100 palabras</div>
                    </div>
                </div>
            `;
        }
        // Carteras no llevan dedicatoria
    }
    // Solo carteras: sin dedicatoria (no se agrega nada)
    
    // ===== SECCIÓN 4: MÉTODO DE PAGO =====
    formularioHTML += `
        <div class="checkout-section">
            <h3 class="checkout-section-title">Método de pago *</h3>
            <div class="checkout-radio-group">
                <label class="checkout-radio-option">
                    <input type="radio" name="chk-pago" value="Pago Móvil">
                    <span>Pago Móvil</span>
                </label>
                <label class="checkout-radio-option">
                    <input type="radio" name="chk-pago" value="Zelle">
                    <span>Zelle</span>
                </label>
                <label class="checkout-radio-option">
                    <input type="radio" name="chk-pago" value="Dólares en efectivo">
                    <span>Dólares en efectivo</span>
                </label>
            </div>
        </div>
    `;
    
    // ===== SECCIÓN 5: FECHA Y HORA =====
    const fechaMinima = obtenerFechaMinima();
    formularioHTML += `
        <div class="checkout-section">
            <h3 class="checkout-section-title">Fecha y hora de entrega *</h3>
            <input type="datetime-local" id="chk-fecha" class="checkout-input" 
                   min="${fechaMinima}" required>
        </div>
    `;
    
    // ===== SECCIÓN 6: TIPO DE ENTREGA =====
    // Solo carteras → solo retiro en tienda
    if (tieneCarteras && !tieneCatalogo && !tieneTienda) {
        formularioHTML += `
            <div class="checkout-section">
                <h3 class="checkout-section-title">Retiro en tienda</h3>
                <div class="checkout-alert">
                    Las carteras se retiran en nuestra tienda física: <strong>Sambil Paraguaná, Local L-13</strong>
                </div>
            </div>
        `;
    }
    // Solo arreglos de tienda → solo retiro en tienda
    else if (tieneTienda && !tieneCatalogo && !esMixto) {
        formularioHTML += `
            <div class="checkout-section">
                <h3 class="checkout-section-title">Retiro en tienda</h3>
                <div class="checkout-alert">
                    📍 Este arreglo se retira en nuestra tienda física: <strong>Sambil Paraguaná, Local L-13</strong>
                </div>
            </div>
        `;
    }
    // Solo arreglos de catálogo → opción tienda o delivery
    else if (tieneCatalogo && !tieneTienda && !tieneCarteras) {
        formularioHTML += seccionEntregaHTML();
    }
    // Mixto → opción tienda o delivery
    else if (esMixto) {
        formularioHTML += seccionEntregaHTML();
    }
    
    // ===== BOTÓN ENVIAR =====
    formularioHTML += `
        <button type="button" class="checkout-btn-submit" onclick="enviarPedidoWhatsApp()">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Enviar pedido por WhatsApp
        </button>
    `;
    
    // ===== ENSAMBLAR CARD =====
    const tituloHeader = esMixto ? 'Finalizar Pedido Mixto' : 
                         (tieneCatalogo ? 'Finalizar Compra' : 
                          (tieneTienda ? 'Retiro en Tienda' : 'Finalizar Compra'));
    
    overlay.innerHTML = `
        <div class="amore-checkout-card">
            <div class="checkout-header">
                <button class="checkout-close" onclick="cerrarCheckout()">&times;</button>
                <h2>${tituloHeader}</h2>
                <p>Completa tus datos para procesar tu pedido</p>
            </div>
            <div class="checkout-body">
                <form id="amore-checkout-form" onsubmit="return false;">
                    ${formularioHTML}
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Inicializar listeners de radio buttons
    inicializarRadioListeners();
}

/* ============================================================
   5. FUNCIONES AUXILIARES DE HTML
   ============================================================ */
function productoItemHTML(p) {
    return `
        <div class="checkout-product-item">
            <span class="checkout-product-name">${p.nombre}</span>
            ${p.cantidad > 1 ? `<span class="checkout-product-qty">x${p.cantidad}</span>` : ''}
            <span class="checkout-product-price">$${formatearPrecioCheckout(p.subtotal)}</span>
        </div>
    `;
}

function dedicatoriaHTML(tipo, maxPalabras) {
    const titulo = tipo === 'catalogo' ? 'Dedicatoria del arreglo' : 'Dedicatoria';
    const id = `chk-nota-${tipo}`;
    const counterId = `counter-${tipo}`;
    return `
        <div class="checkout-section">
            <h3 class="checkout-section-title">${titulo}</h3>
            <label class="checkout-label" for="${id}">Mensaje para la tarjeta (máx. ${maxPalabras} palabras)</label>
            <textarea id="${id}" class="checkout-textarea"
                      placeholder="Escribe un mensaje especial..."
                      oninput="contarPalabras(this, ${maxPalabras}, '${counterId}')"></textarea>
            <div id="${counterId}" class="checkout-char-counter">0 / ${maxPalabras} palabras</div>
        </div>
    `;
}

function seccionEntregaHTML() {
    return `
        <div class="checkout-section">
            <h3 class="checkout-section-title">Tipo de entrega *</h3>
            <div class="checkout-radio-group">
                <label class="checkout-radio-option">
                    <input type="radio" name="chk-entrega" value="tienda" onchange="toggleEntrega()">
                    <span>Retiro en tienda (Sambil Paraguaná, L-13)</span>
                </label>
                <label class="checkout-radio-option">
                    <input type="radio" name="chk-entrega" value="delivery" onchange="toggleEntrega()">
                    <span>Delivery</span>
                </label>
            </div>
            <div id="chk-delivery-container" style="display:none; margin-top:12px;">
                <label class="checkout-label" for="chk-direccion">Dirección de entrega *</label>
                <input type="text" id="chk-direccion" class="checkout-input" 
                       placeholder="Ej: Calle 5, Casa 12, Punto Fijo">
                <button type="button" class="checkout-btn-gps" onclick="obtenerGPS()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="12" y1="2" x2="12" y2="4"/>
                        <line x1="12" y1="20" x2="12" y2="22"/>
                        <line x1="2" y1="12" x2="4" y2="12"/>
                        <line x1="20" y1="12" x2="22" y2="12"/>
                    </svg>
                    Obtener mi ubicación GPS
                </button>
                <div id="chk-gps-status" class="checkout-gps-status"></div>
            </div>
        </div>
    `;
}

/* ============================================================
   6. FUNCIONES DE INTERACCIÓN
   ============================================================ */
function inicializarRadioListeners() {
    document.querySelectorAll('.checkout-radio-option input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const group = this.closest('.checkout-radio-group');
            group.querySelectorAll('.checkout-radio-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.closest('.checkout-radio-option').classList.add('selected');
        });
    });
}

window.toggleDedicatoriaTienda = function() {
    const valor = document.querySelector('input[name="chk-dedicatoria-tienda"]:checked')?.value;
    const container = document.getElementById('chk-dedicatoria-tienda-container');
    if (container) container.style.display = valor === 'si' ? 'block' : 'none';
};

window.toggleDedicatoriaTiendaMix = function() {
    const valor = document.querySelector('input[name="chk-dedicatoria-tienda-mix"]:checked')?.value;
    const container = document.getElementById('chk-dedicatoria-tienda-mix-container');
    if (container) container.style.display = valor === 'si' ? 'block' : 'none';
};

window.toggleEntrega = function() {
    const valor = document.querySelector('input[name="chk-entrega"]:checked')?.value;
    const container = document.getElementById('chk-delivery-container');
    if (container) {
        container.style.display = valor === 'delivery' ? 'block' : 'none';
        if (valor === 'tienda') {
            // Limpiar GPS si cambia a tienda
            window.gpsCoords = null;
            const status = document.getElementById('chk-gps-status');
            if (status) status.textContent = '';
        }
    }
};

window.contarPalabras = function(textarea, max, counterId) {
    const texto = textarea.value.trim();
    const palabras = texto === '' ? 0 : texto.split(/\s+/).filter(w => w.length > 0).length;
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = `${palabras} / ${max} palabras`;
        counter.classList.remove('warning', 'error');
        if (palabras > max) {
            counter.classList.add('error');
        } else if (palabras >= max * 0.9) {
            counter.classList.add('warning');
        }
    }
};

/* ============================================================
   7. GPS
   ============================================================ */
window.obtenerGPS = function() {
    const status = document.getElementById('chk-gps-status');
    const btn = document.querySelector('.checkout-btn-gps');
    
    if (!navigator.geolocation) {
        status.textContent = 'Tu navegador no soporta geolocalización';
        status.className = 'checkout-gps-status error';
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = 'Obteniendo ubicación...';
    status.textContent = 'Obteniendo tu ubicación...';
    status.className = 'checkout-gps-status';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            window.gpsCoords = { lat, lng };
            status.innerHTML = `✅ Ubicación obtenida <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" style="color:#27ae60; text-decoration:underline;">Ver en mapa</a>`;
            status.className = 'checkout-gps-status success';
            btn.innerHTML = '🔄 Actualizar ubicación';
            btn.disabled = false;
        },
        (error) => {
            let msg = '❌ No se pudo obtener la ubicación. ';
            if (error.code === 1) msg += 'Permiso denegado.';
            else if (error.code === 2) msg += 'Ubicación no disponible.';
            else if (error.code === 3) msg += 'Tiempo de espera agotado.';
            status.textContent = msg;
            status.className = 'checkout-gps-status error';
            btn.innerHTML = '📍 Reintentar obtener GPS';
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
};

/* ============================================================
   8. CERRAR CHECKOUT
   ============================================================ */
window.cerrarCheckout = function() {
    const overlay = document.getElementById('amore-checkout-overlay');
    if (overlay) {
        overlay.style.animation = 'amoreOverlayFade 0.2s ease reverse';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = 'auto';
        }, 200);
    }
};

/* ============================================================
   9. VALIDACIÓN Y ENVÍO DEL PEDIDO
   ============================================================ */
window.enviarPedidoWhatsApp = function() {
    // Obtener datos del formulario
    const nombre = document.getElementById('chk-nombre')?.value.trim();
    const pago = document.querySelector('input[name="chk-pago"]:checked')?.value;
    const fecha = document.getElementById('chk-fecha')?.value;
    
    // Validaciones básicas
    if (!nombre) { alert('Por favor ingresa tu nombre'); return; }
    if (!pago) { alert('Por favor selecciona un método de pago'); return; }
    if (!fecha) { alert('Por favor selecciona fecha y hora de entrega'); return; }
    
    // Determinar tipo de entrega
    const entregaRadio = document.querySelector('input[name="chk-entrega"]:checked');
    let tipoEntrega = 'tienda'; // default
    let direccion = '';
    let gpsLink = '';
    
    if (entregaRadio) {
        tipoEntrega = entregaRadio.value;
        if (tipoEntrega === 'delivery') {
            direccion = document.getElementById('chk-direccion')?.value.trim();
            if (!direccion) { alert('Por favor ingresa la dirección de entrega'); return; }
            if (window.gpsCoords) {
                gpsLink = `https://maps.google.com/?q=${window.gpsCoords.lat},${window.gpsCoords.lng}`;
            }
        }
    }
    
    // Obtener dedicatorias
    let dedicatoriaCatalogo = '';
    let dedicatoriaTienda = '';
    
    const notaCatalogo = document.getElementById('chk-nota-catalogo');
    if (notaCatalogo) {
        const palabras = notaCatalogo.value.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (palabras > 200) {
            alert('La dedicatoria del catálogo no puede exceder 200 palabras');
            return;
        }
        dedicatoriaCatalogo = notaCatalogo.value.trim();
    }
    
    // Dedicatoria tienda (caso no mixto)
    const dedTiendaRadio = document.querySelector('input[name="chk-dedicatoria-tienda"]:checked');
    if (dedTiendaRadio && dedTiendaRadio.value === 'si') {
        const notaTienda = document.getElementById('chk-nota-tienda');
        if (notaTienda) {
            const palabras = notaTienda.value.trim().split(/\s+/).filter(w => w.length > 0).length;
            if (palabras > 100) {
                alert('La dedicatoria no puede exceder 100 palabras');
                return;
            }
            dedicatoriaTienda = notaTienda.value.trim();
        }
    }
    
    // Dedicatoria tienda (caso mixto)
    const dedTiendaMixRadio = document.querySelector('input[name="chk-dedicatoria-tienda-mix"]:checked');
    if (dedTiendaMixRadio && dedTiendaMixRadio.value === 'si') {
        const notaTiendaMix = document.getElementById('chk-nota-tienda-mix');
        if (notaTiendaMix) {
            const palabras = notaTiendaMix.value.trim().split(/\s+/).filter(w => w.length > 0).length;
            if (palabras > 100) {
                alert('La dedicatoria del arreglo de tienda no puede exceder 100 palabras');
                return;
            }
            dedicatoriaTienda = notaTiendaMix.value.trim();
        }
    }
    
    // Construir mensaje
    const mensaje = construirMensajeWhatsApp({
        nombre, pago, fecha, tipoEntrega, direccion, gpsLink,
        dedicatoriaCatalogo, dedicatoriaTienda
    });
    
    // Abrir WhatsApp
    const url = `https://wa.me/${WHATSAPP_CHECKOUT}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    
    // Cerrar formulario
    cerrarCheckout();
};

/* ============================================================
   10. CONSTRUIR MENSAJE WHATSAPP
   ============================================================ */
function construirMensajeWhatsApp(datos) {
    const carrito = JSON.parse(localStorage.getItem('amore_carrito')) || [];
    const clasificacion = clasificarProductos(carrito);
    
    // Si el carrito está vacío, usar el contexto actual (compra directa)
    // Detectamos si hay productos en el overlay actual
    const productosEnForm = document.querySelectorAll('.checkout-product-item');
    
    let mensaje = `✨ *NUEVO PEDIDO AMORE BOX* ✨\n\n`;
    mensaje += ` *Cliente:* ${datos.nombre}\n\n`;
    
    // ===== PRODUCTOS =====
    mensaje += ` *PRODUCTOS:*\n`;
    
    // Re-construir productos desde el DOM del formulario
    productosEnForm.forEach(item => {
        const nombre = item.querySelector('.checkout-product-name')?.textContent || '';
        const qty = item.querySelector('.checkout-product-qty')?.textContent || '';
        const precio = item.querySelector('.checkout-product-price')?.textContent || '';
        mensaje += `  • ${nombre} ${qty} - ${precio}\n`;
    });
    
    // Total
    const totalRow = document.querySelector('.checkout-total-row span:last-child');
    if (totalRow) {
        mensaje += `\n *TOTAL: ${totalRow.textContent}*\n`;
    }
    
    // ===== DEDICATORIAS =====
    if (datos.dedicatoriaCatalogo) {
        mensaje += `\n *DEDICATORIA (Arreglo):*\n"${datos.dedicatoriaCatalogo}"\n`;
    }
    if (datos.dedicatoriaTienda) {
        mensaje += `\n *DEDICATORIA (Arreglo de tienda):*\n"${datos.dedicatoriaTienda}"\n`;
    }
    
    // ===== PAGO =====
    mensaje += `\n *Método de pago:* ${datos.pago}\n`;
    
    // ===== FECHA =====
    const fechaFormateada = formatearFecha(datos.fecha);
    mensaje += ` *Fecha y hora:* ${fechaFormateada}\n`;
    
    // ===== ENTREGA =====
    if (datos.tipoEntrega === 'tienda') {
        mensaje += `\n *Retiro en tienda:* Sambil Paraguaná, Local L-13\n`;
    } else {
        mensaje += `\n *Delivery*\n`;
        mensaje += ` *Dirección:* ${datos.direccion}\n`;
        if (datos.gpsLink) {
            mensaje += ` *GPS:* ${datos.gpsLink}\n`;
        }
    }
    
    mensaje += `\n¡Gracias por tu compra! 🌸`;
    
    return mensaje;
}

/* ============================================================
   11. UTILIDADES
   ============================================================ */
function formatearPrecioCheckout(num) {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function obtenerFechaMinima() {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const opciones = { 
        weekday: 'long', year: 'numeric', month: 'long', 
        day: 'numeric', hour: '2-digit', minute: '2-digit' 
    };
    return fecha.toLocaleDateString('es-VE', opciones);
}