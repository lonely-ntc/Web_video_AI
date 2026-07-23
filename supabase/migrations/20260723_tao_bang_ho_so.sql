-- Bang profiles luu thong tin rieng cua tung tai khoan Supabase.
-- id chinh la auth.users.id, vi vay moi tai khoan chi co mot ho so.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  display_name text not null default '',
  phone text not null default '',
  company text not null default '',
  job_title text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  avatar_path text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_bio_length check (char_length(bio) <= 240)
);

alter table public.profiles
  add column if not exists email text not null default '';

alter table public.profiles
  add column if not exists avatar_url text not null default '';

alter table public.profiles
  add column if not exists avatar_path text not null default '';

alter table public.profiles enable row level security;

grant select, insert, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
revoke all on table public.profiles from anon;

drop policy if exists "Nguoi dung xem ho so cua minh" on public.profiles;
create policy "Nguoi dung xem ho so cua minh"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Nguoi dung tao ho so cua minh" on public.profiles;
create policy "Nguoi dung tao ho so cua minh"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Nguoi dung cap nhat ho so cua minh" on public.profiles;
create policy "Nguoi dung cap nhat ho so cua minh"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Tu dong tao ho so khi co tai khoan moi.
create or replace function public.tao_ho_so_nguoi_dung_moi()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    phone,
    company,
    job_title,
    bio,
    avatar_url,
    avatar_path
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'company', ''),
    coalesce(new.raw_user_meta_data ->> 'job_title', ''),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_path', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.tao_ho_so_nguoi_dung_moi() from public;

drop trigger if exists tao_ho_so_sau_khi_dang_ky on auth.users;
create trigger tao_ho_so_sau_khi_dang_ky
  after insert on auth.users
  for each row execute procedure public.tao_ho_so_nguoi_dung_moi();

-- Tao ho so cho cac tai khoan da dang ky truoc khi migration nay duoc chay.
insert into public.profiles (
  id,
  email,
  full_name,
  display_name,
  phone,
  company,
  job_title,
  bio,
  avatar_url,
  avatar_path
)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  coalesce(
    raw_user_meta_data ->> 'display_name',
    raw_user_meta_data ->> 'full_name',
    ''
  ),
  coalesce(raw_user_meta_data ->> 'phone', ''),
  coalesce(raw_user_meta_data ->> 'company', ''),
  coalesce(raw_user_meta_data ->> 'job_title', ''),
  coalesce(raw_user_meta_data ->> 'bio', ''),
  coalesce(raw_user_meta_data ->> 'avatar_url', ''),
  coalesce(raw_user_meta_data ->> 'avatar_path', '')
from auth.users
on conflict (id) do update
set email = excluded.email;

-- Kho anh dai dien cong khai, chi nhan JPG, PNG va WebP toi da 5 MB.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Nguoi dung xem anh dai dien cua minh" on storage.objects;
create policy "Nguoi dung xem anh dai dien cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai anh dai dien cua minh" on storage.objects;
create policy "Nguoi dung tai anh dai dien cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung cap nhat anh dai dien cua minh" on storage.objects;
create policy "Nguoi dung cap nhat anh dai dien cua minh"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
