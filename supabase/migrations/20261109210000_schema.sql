create extension if not exists unaccent with schema extensions;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  status text check (status in ('confirmado', 'nao_vai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_name_length check (char_length(btrim(name)) between 2 and 100)
);

create table if not exists public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create or replace function public.normalize_guest_name()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.name := regexp_replace(btrim(new.name), '\s+', ' ', 'g');
  if char_length(new.name) < 2 or char_length(new.name) > 100 then
    raise exception 'O nome deve ter de 2 a 100 caracteres.';
  end if;
  new.normalized_name := lower(extensions.unaccent(new.name));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guests_normalize_name on public.guests;
create trigger guests_normalize_name
before insert or update of name, status on public.guests
for each row execute function public.normalize_guest_name();

create or replace function public.is_wedding_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.guests enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "Admin can manage guests" on public.guests;
create policy "Admin can manage guests"
on public.guests
for all
to authenticated
using (public.is_wedding_admin())
with check (public.is_wedding_admin());

drop policy if exists "Anyone can read public site content" on public.site_content;
create policy "Anyone can read public site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Admin can manage site content" on public.site_content;
create policy "Admin can manage site content"
on public.site_content
for all
to authenticated
using (public.is_wedding_admin())
with check (public.is_wedding_admin());

revoke all on table public.guests from anon, authenticated;
grant select, insert, update, delete on table public.guests to authenticated;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;

create or replace function public.submit_rsvp(
  p_name text,
  p_status text,
  p_confirm_update boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text;
  normalized text;
  existing_id uuid;
begin
  clean_name := pg_catalog.regexp_replace(pg_catalog.btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if pg_catalog.char_length(clean_name) < 2 or pg_catalog.char_length(clean_name) > 100 then
    raise exception 'O nome deve ter de 2 a 100 caracteres.';
  end if;
  if p_status is null or p_status not in ('confirmado', 'nao_vai') then
    raise exception 'Status de resposta inválido.';
  end if;

  normalized := pg_catalog.lower(extensions.unaccent(clean_name));
  select id into existing_id
  from public.guests
  where normalized_name = normalized
  for update;

  if existing_id is not null then
    if not coalesce(p_confirm_update, false) then
      return pg_catalog.jsonb_build_object('duplicate', true, 'saved', false);
    end if;
    update public.guests
      set name = clean_name, status = p_status
      where id = existing_id;
    return pg_catalog.jsonb_build_object('duplicate', false, 'saved', true);
  end if;

  if coalesce(p_confirm_update, false) then
    return pg_catalog.jsonb_build_object('duplicate', false, 'saved', false);
  end if;

  begin
    insert into public.guests (name, normalized_name, status)
    values (clean_name, normalized, p_status);
  exception when unique_violation then
    return pg_catalog.jsonb_build_object('duplicate', true, 'saved', false);
  end;
  return pg_catalog.jsonb_build_object('duplicate', false, 'saved', true);
end;
$$;

revoke all on function public.submit_rsvp(text, text, boolean) from public, anon, authenticated;
grant execute on function public.submit_rsvp(text, text, boolean) to anon, authenticated;
revoke all on function public.is_wedding_admin() from public, anon;
grant execute on function public.is_wedding_admin() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read wedding site images" on storage.objects;
create policy "Public can read wedding site images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "Wedding admin can upload site images" on storage.objects;
create policy "Wedding admin can upload site images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-images' and public.is_wedding_admin());

drop policy if exists "Wedding admin can update site images" on storage.objects;
create policy "Wedding admin can update site images"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-images' and public.is_wedding_admin())
with check (bucket_id = 'site-images' and public.is_wedding_admin());

drop policy if exists "Wedding admin can delete site images" on storage.objects;
create policy "Wedding admin can delete site images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-images' and public.is_wedding_admin());
