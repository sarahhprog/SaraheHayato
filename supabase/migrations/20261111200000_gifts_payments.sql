create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text not null,
  price numeric(10, 2) not null check (price > 0),
  status text not null default 'available'
    check (status in ('available', 'unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gifts_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint gifts_description_length check (char_length(btrim(description)) between 1 and 500)
);

create table if not exists public.gift_payment_attempts (
  id uuid primary key,
  external_reference uuid not null unique,
  gift_id uuid not null references public.gifts(id) on delete restrict,
  payer_name text not null,
  message text not null,
  amount numeric(10, 2) not null check (amount > 0),
  status text not null default 'pending'
    check (status in (
      'pending',
      'in_process',
      'approved',
      'rejected',
      'cancelled',
      'refunded',
      'charged_back',
      'duplicate_refund_required',
      'amount_mismatch',
      'preference_failed',
      'other'
    )),
  mp_preference_id text,
  mp_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_payment_attempts_name_length check (char_length(btrim(payer_name)) between 2 and 100),
  constraint gift_payment_attempts_message_length check (char_length(btrim(message)) between 1 and 1000)
);

create table if not exists public.gift_purchases (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null unique references public.gifts(id) on delete restrict,
  payer_name text not null,
  message text not null,
  amount_paid numeric(10, 2) not null check (amount_paid > 0),
  mp_payment_id text not null unique,
  purchased_at timestamptz not null,
  constraint gift_purchases_name_length check (char_length(btrim(payer_name)) between 2 and 100),
  constraint gift_purchases_message_length check (char_length(btrim(message)) between 1 and 1000)
);

create index if not exists gift_payment_attempts_status_created_at_idx
  on public.gift_payment_attempts (status, created_at desc);
create index if not exists gift_payment_attempts_gift_id_idx
  on public.gift_payment_attempts (gift_id);

alter table public.gifts enable row level security;
alter table public.gift_payment_attempts enable row level security;
alter table public.gift_purchases enable row level security;

drop policy if exists "Anyone can read the public gift list" on public.gifts;
create policy "Anyone can read the public gift list"
on public.gifts
for select
to anon, authenticated
using (true);

drop policy if exists "Wedding admin can manage gifts" on public.gifts;
create policy "Wedding admin can manage gifts"
on public.gifts
for all
to authenticated
using (public.is_wedding_admin())
with check (public.is_wedding_admin());

drop policy if exists "Wedding admin can read gift payment attempts" on public.gift_payment_attempts;
create policy "Wedding admin can read gift payment attempts"
on public.gift_payment_attempts
for select
to authenticated
using (public.is_wedding_admin());

drop policy if exists "Wedding admin can read completed gift purchases" on public.gift_purchases;
create policy "Wedding admin can read completed gift purchases"
on public.gift_purchases
for select
to authenticated
using (public.is_wedding_admin());

revoke all on table public.gifts from anon, authenticated;
grant select on table public.gifts to anon, authenticated;
grant insert (name, description, image_url, price) on table public.gifts to authenticated;
grant update (name, description, image_url, price) on table public.gifts to authenticated;
grant delete on table public.gifts to authenticated;
grant all on table public.gifts to service_role;

revoke all on table public.gift_payment_attempts from anon, authenticated;
grant select on table public.gift_payment_attempts to authenticated;
grant all on table public.gift_payment_attempts to service_role;

revoke all on table public.gift_purchases from anon, authenticated;
grant select on table public.gift_purchases to authenticated;
grant all on table public.gift_purchases to service_role;

create or replace function public.confirm_gift_payment(
  p_external_reference uuid,
  p_payment_id text,
  p_payment_status text,
  p_transaction_amount numeric,
  p_currency_id text,
  p_payment_date timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_attempt public.gift_payment_attempts%rowtype;
  purchase_id uuid;
  next_status text;
begin
  select *
  into payment_attempt
  from public.gift_payment_attempts
  where external_reference = p_external_reference
  for update;

  if not found then
    raise exception 'Tentativa de pagamento não encontrada.';
  end if;

  if payment_attempt.mp_payment_id = p_payment_id
     and payment_attempt.status in (
       'approved',
       'duplicate_refund_required',
       'amount_mismatch',
       'refunded',
       'charged_back'
     )
     and not (
       p_payment_status in ('refunded', 'charged_back')
       and payment_attempt.status in ('duplicate_refund_required', 'amount_mismatch')
     ) then
    return pg_catalog.jsonb_build_object('status', payment_attempt.status, 'processed', true);
  end if;

  if p_payment_status is distinct from 'approved' then
    next_status := case p_payment_status
      when 'pending' then 'pending'
      when 'in_process' then 'in_process'
      when 'rejected' then 'rejected'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'refunded'
      when 'charged_back' then 'charged_back'
      else 'other'
    end;

    update public.gift_payment_attempts
    set status = next_status,
        mp_payment_id = p_payment_id,
        updated_at = pg_catalog.now()
    where id = payment_attempt.id;

    return pg_catalog.jsonb_build_object('status', next_status, 'processed', true);
  end if;

  if p_currency_id is distinct from 'BRL'
     or p_transaction_amount is distinct from payment_attempt.amount then
    update public.gift_payment_attempts
    set status = 'amount_mismatch',
        mp_payment_id = p_payment_id,
        updated_at = pg_catalog.now()
    where id = payment_attempt.id;

    return pg_catalog.jsonb_build_object('status', 'amount_mismatch', 'processed', true);
  end if;

  -- The unique gift_id makes simultaneous approved payments resolve to one winner.
  insert into public.gift_purchases (
    gift_id,
    payer_name,
    message,
    amount_paid,
    mp_payment_id,
    purchased_at
  )
  values (
    payment_attempt.gift_id,
    payment_attempt.payer_name,
    payment_attempt.message,
    payment_attempt.amount,
    p_payment_id,
    coalesce(p_payment_date, pg_catalog.now())
  )
  on conflict (gift_id) do nothing
  returning id into purchase_id;

  if purchase_id is null then
    update public.gift_payment_attempts
    set status = 'duplicate_refund_required',
        mp_payment_id = p_payment_id,
        updated_at = pg_catalog.now()
    where id = payment_attempt.id;

    return pg_catalog.jsonb_build_object('status', 'duplicate_refund_required', 'processed', true);
  end if;

  update public.gifts
  set status = 'unavailable',
      updated_at = pg_catalog.now()
  where id = payment_attempt.gift_id;

  update public.gift_payment_attempts
  set status = 'approved',
      mp_payment_id = p_payment_id,
      updated_at = pg_catalog.now()
  where id = payment_attempt.id;

  return pg_catalog.jsonb_build_object('status', 'approved', 'processed', true);
end;
$$;

revoke all on function public.confirm_gift_payment(uuid, text, text, numeric, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.confirm_gift_payment(uuid, text, text, numeric, text, timestamptz)
  to service_role;

insert into public.gifts (id, name, description, image_url, price)
values
  ('e721116e-5a8f-4fa2-a7f9-e621a50e3021', 'Jantar sob as estrelas', 'Uma noite especial para celebrar nossa nova vida.', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85', 420.00),
  ('943e13cb-54e6-40b6-b57b-96f5ad8349b0', 'Passeio pelos canais', 'Uma experiência inesquecível durante a lua de mel.', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=85', 680.00),
  ('a1df9cf0-03ac-4c0d-a4df-7028ed3129a3', 'Conjunto de taças', 'Para brindar os momentos especiais em nosso lar.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85', 350.00),
  ('b6e5898e-aed0-41fb-8dd1-40fbe987ac4f', 'Café da manhã em Paris', 'Um café charmoso na viagem dos nossos sonhos.', 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=900&q=85', 290.00),
  ('c4642ac8-7f6d-4c36-a070-e2d384859546', 'Jardim para a varanda', 'Um cantinho verde para nossa casa.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85', 180.00),
  ('d737d825-b986-4ccd-a38e-38ab868352f7', 'Brinde dos recém-casados', 'Um brinde ao começo da nossa vida juntos.', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85', 240.00),
  ('efda0d42-b4e7-48d0-a5e6-1c1fa0ca56f4', 'Malas para novas viagens', 'Malas leves para as nossas proximas aventuras.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 560.00),
  ('f3480fd7-4a28-4a63-9921-0ab384c50561', 'Aula de culinária a dois', 'Uma experiência deliciosa para cozinhar juntos.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85', 310.00)
on conflict (id) do nothing;
