-- =============================================================
--  AMOREBOX · TABLA DE PEDIDOS
--  Copia TODO este archivo y pégalo en el SQL Editor de Supabase
--  (una sola vez). Es seguro repetirlo: no borra nada.
--
--  Qué hace:
--   · Crea la tabla `pedidos` (cada compra por WhatsApp queda aquí)
--   · Cualquier visitante puede REGISTRAR su pedido (la web es pública)
--   · Solo el administrador autenticado puede LEER o CAMBIAR estado
--   · Activa TIEMPO REAL: el panel suena/actualiza solo cuando entra uno
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.pedidos (
    id          uuid primary key default gen_random_uuid(),
    creado_en   timestamptz not null default now(),
    origen      text not null default 'web',
    items       jsonb not null default '[]'::jsonb,
    total       numeric(12,2) not null default 0,
    estado      text not null default 'nuevo'
                check (estado in ('nuevo', 'confirmado', 'entregado', 'cancelado')),
    notas       text
);

-- Seguridad (RLS)
alter table public.pedidos enable row level security;

-- CUALQUIER visitante puede REGISTRAR pedidos (la web es pública).
-- Cubre a anon Y authenticated: así el pedido se registra igual aunque
-- el dueño pruebe la tienda con la sesión del admin abierta en el navegador.
-- El guard garantiza que nadie inserte filas con estado prefabricado.
drop policy if exists "pedidos_insert_publico" on public.pedidos;
drop policy if exists "pedidos_insert_publico_anon" on public.pedidos;
drop policy if exists "pedidos_insert_publico_auth" on public.pedidos;
create policy "pedidos_insert_publico"
    for insert to anon, authenticated
    with check (estado = 'nuevo');

-- El administrador (sesión iniciada) puede leer, actualizar y borrar
drop policy if exists "pedidos_select_admin" on public.pedidos;
create policy "pedidos_select_admin" on public.pedidos
    for select to authenticated using (true);

drop policy if exists "pedidos_update_admin" on public.pedidos;
create policy "pedidos_update_admin" on public.pedidos
    for update to authenticated using (true) with check (true);

drop policy if exists "pedidos_delete_admin" on public.pedidos;
create policy "pedidos_delete_admin" on public.pedidos
    for delete to authenticated using (true);

-- Tiempo real: el panel se actualiza solo cuando entra un pedido nuevo
do $$
begin
    alter publication supabase_realtime add table public.pedidos;
exception
    when duplicate_object then null;  -- ya estaba agregada
    when others then null;            -- publicación no disponible: no pasa nada
end $$;
