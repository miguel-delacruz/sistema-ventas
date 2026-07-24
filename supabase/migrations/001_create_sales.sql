begin;

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  cliente text not null check (char_length(cliente) between 2 and 120),
  producto text not null check (char_length(producto) between 2 and 120),
  monto numeric(12,2) not null check (monto > 0),
  medio_pago text not null check (medio_pago in ('Crypto', 'Transferencia', 'Tarjeta', 'Efectivo', 'PayPal')),
  canal text not null check (canal in ('Directo', 'MQL5')),
  tipo_operacion text not null default 'Venta nueva'
    check (tipo_operacion in ('Venta nueva', 'Renovación', 'Upsell', 'Reembolso')),
  observaciones text check (observaciones is null or char_length(observaciones) <= 1000),
  usuario_id uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists ventas_fecha_idx on public.ventas (fecha desc);
create index if not exists ventas_created_at_idx on public.ventas (created_at desc);
alter table public.ventas enable row level security;
revoke all on table public.ventas from anon;
grant select, insert on table public.ventas to authenticated;
grant select on table public.ventas to service_role;

drop policy if exists "Usuarios autenticados consultan ventas" on public.ventas;
create policy "Usuarios autenticados consultan ventas"
  on public.ventas for select to authenticated using (true);

drop policy if exists "Usuarios autenticados registran ventas" on public.ventas;
create policy "Usuarios autenticados registran ventas"
  on public.ventas for insert to authenticated with check (usuario_id = auth.uid());

commit;
