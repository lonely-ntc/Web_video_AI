-- Bang ai_avatars luu Avatar AI rieng cua tung tai khoan Supabase.
-- Anh Avatar duoc luu trong bucket ai-avatars, bang chi luu duong dan.
-- Bucket nay khac voi bucket "avatars" (anh dai dien ho so nguoi dung).

create table if not exists public.ai_avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  file_path text not null,
  format text not null,
  size_bytes bigint not null default 0,
  width integer,
  height integer,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint ai_avatars_name_not_blank
    check (char_length(btrim(name)) between 1 and 150),
  constraint ai_avatars_format_valid
    check (format in ('PNG', 'JPG', 'WEBP')),
  constraint ai_avatars_size_bytes_valid
    check (size_bytes >= 0)
);

comment on table public.ai_avatars is
  'Avatar AI nguoi dung upload, moi ban ghi thuoc ve mot tai khoan Supabase.';
comment on column public.ai_avatars.file_path is
  'Duong dan file trong bucket ai-avatars, khong luu signed URL.';

create index if not exists ai_avatars_user_updated_at_idx
  on public.ai_avatars (user_id, updated_at desc);

create index if not exists ai_avatars_user_project_idx
  on public.ai_avatars (user_id, project_id);

-- Moi tai khoan chi co toi da mot Avatar mac dinh.
create unique index if not exists ai_avatars_one_default_per_user_idx
  on public.ai_avatars (user_id)
  where is_default;

-- Tu dong cap nhat updated_at khi Avatar thay doi.
create or replace function public.cap_nhat_thoi_gian_avatar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_avatar() from public;

drop trigger if exists cap_nhat_ai_avatars_updated_at on public.ai_avatars;
create trigger cap_nhat_ai_avatars_updated_at
  before update on public.ai_avatars
  for each row execute procedure public.cap_nhat_thoi_gian_avatar();

-- Dam bao project_id gan vao Avatar phai thuoc ve dung tai khoan dang thao tac.
create or replace function public.kiem_tra_chu_so_huu_ai_avatars()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects
    where id = new.project_id and user_id = new.user_id
  ) then
    raise exception 'project_id khong thuoc ve tai khoan nay';
  end if;

  return new;
end;
$$;

revoke all on function public.kiem_tra_chu_so_huu_ai_avatars() from public;

drop trigger if exists kiem_tra_chu_so_huu_ai_avatars_trg on public.ai_avatars;
create trigger kiem_tra_chu_so_huu_ai_avatars_trg
  before insert or update on public.ai_avatars
  for each row execute procedure public.kiem_tra_chu_so_huu_ai_avatars();

-- Moi tai khoan chi truy cap Avatar cua chinh minh qua Supabase API.
alter table public.ai_avatars enable row level security;

grant select, insert, update, delete on table public.ai_avatars to authenticated;
grant all on table public.ai_avatars to service_role;
revoke all on table public.ai_avatars from anon;

drop policy if exists "Nguoi dung xem avatar cua minh" on public.ai_avatars;
create policy "Nguoi dung xem avatar cua minh"
on public.ai_avatars
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao avatar cua minh" on public.ai_avatars;
create policy "Nguoi dung tao avatar cua minh"
on public.ai_avatars
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat avatar cua minh" on public.ai_avatars;
create policy "Nguoi dung cap nhat avatar cua minh"
on public.ai_avatars
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa avatar cua minh" on public.ai_avatars;
create policy "Nguoi dung xoa avatar cua minh"
on public.ai_avatars
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Kho anh Avatar AI rieng tu, toi da 10 MB cho moi anh.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ai-avatars',
  'ai-avatars',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quy uoc duong dan: user_id/avatar_id/ten-file.
drop policy if exists "Nguoi dung xem file avatar cua minh" on storage.objects;
create policy "Nguoi dung xem file avatar cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ai-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai file avatar cua minh" on storage.objects;
create policy "Nguoi dung tai file avatar cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ai-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung cap nhat file avatar cua minh" on storage.objects;
create policy "Nguoi dung cap nhat file avatar cua minh"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ai-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'ai-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung xoa file avatar cua minh" on storage.objects;
create policy "Nguoi dung xoa file avatar cua minh"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ai-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Bat Realtime de giao dien tu cap nhat danh sach Avatar AI khi co
-- insert/update/delete, khong can bam tai lai trang.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ai_avatars'
  ) then
    alter publication supabase_realtime add table public.ai_avatars;
  end if;
end;
$$;
