-- =============================================================
--  AMOREBOX · SEED INICIAL
--  Carga los 70 productos que hoy están en el HTML estático.
--  Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql
--  (puede repetirse: ON CONFLICT evita duplicar el seed)
--  Para migrar fotos y reemplazar estas rutas por URLs de Cloudinary,
--  ejecuta `npm run migrate:cloudinary` con el catálogo actual accesible.
-- =============================================================

INSERT INTO public.productos (categoria, nombre, descripcion, marca, precio, imagen_url, stock, destacado) VALUES

-- ============ CARTERAS (21) · stock 1: única existencia por modelo ============
('cartera', 'Caramel',         'Coach',         'Coach',         340, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661722/amorebox/catalogo/Carteras/20260110_113035.webp', 1, false),
('cartera', 'Greige',          'Coach',         'Coach',         320, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661727/amorebox/catalogo/Carteras/20260110_113304.webp', 1, false),
('cartera', 'Rockstar',        'Coach',         'Coach',         405, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661729/amorebox/catalogo/Carteras/20260110_115436.webp', 1, false),
('cartera', 'Red Velvet',      'Michael Kors',  'Michael Kors',  240, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661731/amorebox/catalogo/Carteras/20260110_115104.webp', 1, false),
('cartera', 'Brown',           'Michael Kors',  'Michael Kors',  170, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661733/amorebox/catalogo/Carteras/20260110_112932.webp', 1, false),
('cartera', 'Deep Green',      'Michael Kors',  'Michael Kors',  280, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661734/amorebox/catalogo/Carteras/20260110_115302.webp', 1, false),
('cartera', 'Silver and Green','Steve Madden',  'Steve Madden',   80, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661876/amorebox/catalogo/Carteras/20260110_111919.webp', 1, false),
('cartera', 'Chocolate',       'Steve Madden',  'Steve Madden',   85, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661877/amorebox/catalogo/Carteras/20260502_125907.webp', 1, false),
('cartera', 'BloodStone',      'Steve Madden',  'Steve Madden',   75, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661878/amorebox/catalogo/Carteras/20260110_112753.webp', 1, false),
('cartera', 'Cherry',          'Steve Madden',  'Steve Madden',  100, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661881/amorebox/catalogo/Carteras/20260110_112015.webp', 1, false),
('cartera', 'Love',            'Steve Madden',  'Steve Madden',   85, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661882/amorebox/catalogo/Carteras/20260502_130239.webp', 1, false),
('cartera', 'Strawberry Pink', 'Steve Madden',  'Steve Madden',   75, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661883/amorebox/catalogo/Carteras/20260502_130204.webp', 1, false),
('cartera', 'Pink',            'Steve Madden',  'Steve Madden',   50, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661884/amorebox/catalogo/Carteras/20260110_180054.webp', 1, false),
('cartera', 'Rockstar Pink',   'Steve Madden',  'Steve Madden',   80, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661885/amorebox/catalogo/Carteras/20260502_132030.webp', 1, false),
('cartera', 'Patent',          'Steve Madden',  'Steve Madden',   85, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661886/amorebox/catalogo/Carteras/20260502_132004.webp', 1, false),
('cartera', 'Black Cherry',    'Steve Madden',  'Steve Madden',  100, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661887/amorebox/catalogo/Carteras/20260502_125826.webp', 1, false),
('cartera', 'Twin Black',      'Steve Madden',  'Steve Madden',  100, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661888/amorebox/catalogo/Carteras/20260502_130133.webp', 1, false),
('cartera', 'Twin Beige',      'Steve Madden',  'Steve Madden',  100, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661888/amorebox/catalogo/Carteras/20260502_130052.webp', 1, false),
('cartera', 'Cloud',           'Steve Madden',  'Steve Madden',   50, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661890/amorebox/catalogo/Carteras/20260110_175926.webp', 1, false),
('cartera', 'Old Money',       'Nine West',     'Nine West',      50, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661892/amorebox/catalogo/Carteras/20260110_174340.webp', 1, false),
('cartera', 'Pacific',         'Nautica',       'Nautica',        50, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661893/amorebox/catalogo/Carteras/20260110_173446.webp', 1, false),

-- ============ ARREGLOS FLORALES (49) ============
('arreglo', 'Red Velvet Heart',   'Destaca por su elegancia, imponente presencia y su estio romántico pero lujoso.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661894/amorebox/catalogo/Arreglos/image2.jpg', 10, false),
('arreglo', 'Corazón Eterno',      'Belleza de más de 100 rosas preciosas.', NULL, 290, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661895/amorebox/catalogo/Arreglos/image30.jpg', 10, false),
('arreglo', 'Esperanza',           'Hermoso bouquet de 40 rosas.  Sutil y perfecto.', NULL, 150, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661896/amorebox/catalogo/Arreglos/image29.jpg', 10, false),
('arreglo', 'Ilusión',             'Precioso bouquet de 50 rosas y lirios. Incluye mensaje en cinta.', NULL, 200, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661897/amorebox/catalogo/Arreglos/image4.jpg', 10, false),
('arreglo', 'Bouquet de Corazón',  'Es realmente increible.', NULL, 90, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661898/amorebox/catalogo/Arreglos/image18.jpg', 10, false),
('arreglo', 'Bella',               '¿Muchas rosas? Claro que sí. Base de 40 cm, arreglo de gran presencia.', NULL, 160, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661898/amorebox/catalogo/Arreglos/image14.jpg', 10, true),
('arreglo', 'Coqueta',             'Versión de 30 cm.', NULL, 130, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661899/amorebox/catalogo/Arreglos/image17.jpg', 10, false),
('arreglo', 'Bouquet Especial',    'Hermoso bouquet de rosas deluxe.', NULL, 110, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661900/amorebox/catalogo/Arreglos/image19.jpg', 10, false),
('arreglo', 'Bouquet Especial XL', '50 rosas de su color favorito.', NULL, 150, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661901/amorebox/catalogo/Arreglos/image25.jpg', 10, false),
('arreglo', 'Bouquet Sorpresa',    'En este espectacular diseño se encuentra oculto un teléfono.  Al ella halar la cinta de seda será revelada la sorpresa.', NULL, 130, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661901/amorebox/catalogo/Arreglos/image24.jpg', 10, false),
('arreglo', 'Something Blue',      'Cromático, combinando la mística del color azul con la delicadeza de los tonos neutros.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661902/amorebox/catalogo/Arreglos/image16.jpg', 10, false),
('arreglo', 'Juicy',               'Denso y llamativo, entre tonalidades cálidas y vibrantes.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661903/amorebox/catalogo/Arreglos/image39.jpg', 10, false),
('arreglo', 'Armonía',             'Un diseño grande, simétrico y armonioso.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661904/amorebox/catalogo/Arreglos/image46.jpg', 10, false),
('arreglo', 'Cumpleañera',         'Hermoso arreglo de flores variadas, pastel pequeño y corona para la cumpleañera.', NULL, 80, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661904/amorebox/catalogo/Arreglos/image31.jpg', 10, true),
('arreglo', 'Complicidad',         'Rosas, liciantus y colores vibrantes o suaves. Como ella lo prefiera.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661905/amorebox/catalogo/Arreglos/image20.jpg', 10, false),
('arreglo', 'Amor',                'Arreglo floral equilibrado que encaja perfectamente en cualquier rincón especial del hogar.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661905/amorebox/catalogo/Arreglos/image21.jpg', 10, false),
('arreglo', 'Ternura',             'Delicado, tierno y juguetón. Ideal para las princesas de la casa.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661906/amorebox/catalogo/Arreglos/image22.jpg', 10, false),
('arreglo', 'Calidez',             'Formas circulares que evocan un abrazo que nunca termina.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661907/amorebox/catalogo/Arreglos/image23.jpg', 10, false),
('arreglo', 'Aurora',              'Base redonda que crea la ilusión de un jardín que nace desde el interior.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661908/amorebox/catalogo/Arreglos/image3.jpg', 10, false),
('arreglo', 'Primavera',           'Esta belleza de dos colores (o uno) se va robar su corazón.  Elige sus colores favoritos.', NULL, 60, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661908/amorebox/catalogo/Arreglos/image34.jpg', 10, true),
('arreglo', 'Gratitud',            'Hermoso Bouquet mediano en espuma floral.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661909/amorebox/catalogo/Arreglos/image27.jpg', 10, false),
('arreglo', 'Detalles',            'Para él o para ella, esta caja guarda ese obsequio especial junto con flores para combinar.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661910/amorebox/catalogo/Arreglos/image28.jpg', 10, false),
('arreglo', 'Ella',                '¿Ya estás seguro? Es el momento.  Esta propuesta será inolvidable.', NULL, 140, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661911/amorebox/catalogo/Arreglos/image41.jpg', 10, false),
('arreglo', 'Corporativa',         'Inauguración, aniversario, nueva sede... ¡Lo tenemos cubierto!.', NULL, 60, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661912/amorebox/catalogo/Arreglos/image42.jpg', 10, false),
('arreglo', 'Alegría',             'Un jardín que combina la practicidad con la belleza natural. Disponibles carteras para combinar.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661912/amorebox/catalogo/Arreglos/image8.jpg', 10, false),
('arreglo', 'Exclusividad',        'Un obsequio único e inolvidable para ella, que es tan especial.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661913/amorebox/catalogo/Arreglos/image7.jpg', 10, false),
('arreglo', 'Pradera',             'Arrglo floral alegre, vibrante y caracterizado por su abundancia de color.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661914/amorebox/catalogo/Arreglos/image9.jpg', 10, false),
('arreglo', 'Páramo',              'Inmensa, imponente. Arreglo 360°.  Cesta cargada de un mix de flores preciosas a tu elección.', NULL, 100, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661915/amorebox/catalogo/Arreglos/image50.jpg', 10, false),
('arreglo', 'Energía',             'Frescura en un arreglo, diseñado para durar y brillar.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661915/amorebox/catalogo/Arreglos/image11.jpg', 10, false),
('arreglo', 'Amanecer',            'Girasoles imponentes constrastados con rosas y baby rosas.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661916/amorebox/catalogo/Arreglos/image10.jpg', 10, false),
('arreglo', 'Lirios y clavelinas', 'Cesta con tapa, flores y lirios hermosos.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661916/amorebox/catalogo/Arreglos/image12.jpg', 10, false),
('arreglo', 'Vida',                'Cesta Mediana, 22cm (con asa).  Cargada de un mix de flores preciosas a tu elección.', NULL, 60, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661917/amorebox/catalogo/Arreglos/image40.jpg', 10, true),
('arreglo', 'Encanto',             'Cesta con tapa, 22cm.  Con tonos sutiles o vivos.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661917/amorebox/catalogo/Arreglos/image13.jpg', 10, false),
('arreglo', 'Ikebana',             'Arte floral japonés en base plana de cerámica artesanal.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661918/amorebox/catalogo/Arreglos/image36.jpg', 10, false),
('arreglo', 'Jarrón Amore',        'Arreglo de jarrón romantico y llamativo, presentado en un jarrón de cerámica artesanal.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661919/amorebox/catalogo/Arreglos/image35.jpg', 10, false),
('arreglo', 'Orquídea',            'Orquídeas preciosas. Ideal para su hogar.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661920/amorebox/catalogo/Arreglos/image1.jpg', 10, false),
('arreglo', 'Inspiración',         'Uniendo colores, formas y texturas que nos hacen suspirar.', NULL, 60, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661921/amorebox/catalogo/Arreglos/image56.jpg', 10, true),
('arreglo', 'Ramo Primaveral',     'Ideal para celebraciones especiales, gracias a su gran variedad de flores y diseño especial.', NULL, NULL, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661921/amorebox/catalogo/Arreglos/image33.jpg', 10, false),
('arreglo', 'Girasoles y baby rosas', 'Hermoso ramo de girasoles y baby rosas.', NULL, 40, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661922/amorebox/catalogo/Arreglos/image32.jpg', 10, false),
('arreglo', 'Baby Rosas y Tulipanes', 'Hermoso bouquet de rosas pequeñas con 4 tulipanes.', NULL, 80, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661923/amorebox/catalogo/Arreglos/image53.jpg', 10, true),
('arreglo', 'Flores y Tulipanes',  'Un jardín en su mano. Le encantará.', NULL, 40, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661923/amorebox/catalogo/Arreglos/image55.jpg', 10, false),
('arreglo', 'Alma',                'Belleza de 12 rosas, en una envoltura preciosa.', NULL, 40, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661924/amorebox/catalogo/Arreglos/image57.jpg', 10, false),
('arreglo', '50 rosas',            '50 rosas de su color favorito.', NULL, 120, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661925/amorebox/catalogo/Arreglos/image45.jpg', 10, false),
('arreglo', '30 rosas',            'De los favoritos, 30 rosas que va a amar.', NULL, 75, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661926/amorebox/catalogo/Arreglos/image44.jpg', 10, false),
('arreglo', '20 rosas',            '20 rosas para ella, ¿por qué?, porque sí.', NULL, 50, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661927/amorebox/catalogo/Arreglos/image54.jpg', 10, false),
('arreglo', 'Pequeño bouquet de rosas y ferreros', 'Pequeño bouquet de 6 rosas y 3 ferreros.', NULL, 28, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661928/amorebox/catalogo/Arreglos/image47.jpg', 10, false),
('arreglo', 'Gerberas y Rosas',    'Gerberas y rosas', NULL, 35, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661929/amorebox/catalogo/Arreglos/image58.jpg', 10, false),
('arreglo', 'Rosas y lirios',      'Rosas, baby rosas y lirios.', NULL, 50, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661929/amorebox/catalogo/Arreglos/image37.jpg', 10, false),
('arreglo', 'Rosa eterna de tallo largo', 'Rosa eterna de tallo largo.', NULL, 20, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1793661930/amorebox/catalogo/Arreglos/image38.jpg', 10, false)

ON CONFLICT DO NOTHING;

-- ============ ARREGLOS DE TIENDA (6) ============
-- Se muestran en la sección "Arreglos de tienda" del index y también
-- se administran desde el panel con la casilla `en_tienda`.
INSERT INTO public.productos
    (categoria, nombre, descripcion, marca, precio, imagen_url, stock, destacado, en_tienda)
VALUES
    ('arreglo', 'Bouquet de 3 rosas', '', NULL, 20, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1794098479/amorebox/catalogo/Arreglos%20de%20tienda/20261029_173221.jpg', 10, false, true),
    ('arreglo', 'Bouquet de 5 rosas (Especial)', '', NULL, 30, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1794098480/amorebox/catalogo/Arreglos%20de%20tienda/20260725_105902.jpg', 10, false, true),
    ('arreglo', 'Bouquet de 5 rosas (Redondo)', '', NULL, 30, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1794098480/amorebox/catalogo/Arreglos%20de%20tienda/20260809_145237.jpg', 10, false, true),
    ('arreglo', 'Ramo de 2 rosas', '', NULL, 12, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1794098481/amorebox/catalogo/Arreglos%20de%20tienda/20261102_173306.jpg', 10, false, true),
    ('arreglo', 'Baby bouquet de 3 rosas', '', NULL, 12, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1794098481/amorebox/catalogo/Arreglos%20de%20tienda/20261102_184421.jpg', 10, false, true),
    ('arreglo', 'Una rosa arreglada', '', NULL, 6, 'https://res.cloudinary.com/g8hh4hop/image/upload/f_auto,q_auto,w_900,c_limit/v1794098482/amorebox/catalogo/Arreglos%20de%20tienda/20261102_183920.jpg', 10, false, true)
ON CONFLICT DO NOTHING;
