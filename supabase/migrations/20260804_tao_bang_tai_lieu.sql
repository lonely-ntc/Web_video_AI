-- Bang documents luu tai lieu rieng cua tung tai khoan Supabase.
-- File goc duoc luu trong bucket documents, bang chi luu duong dan.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  chapter_id uuid,
  name text not null,
  file_path text not null,
  file_type text not null,
  size_bytes bigint not null default 0,
  status text not null default 'processing',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint documents_name_not_blank
    check (char_length(btrim(name)) between 1 and 200),
  constraint documents_file_type_valid
    check (file_type in ('pdf', 'word', 'ppt', 'txt', 'md')),
  constraint documents_status_valid
    check (status in ('processing', 'ready', 'error')),
  constraint documents_size_bytes_valid
    check (size_bytes >= 0)
);

comment on table public.documents is
  'Tai lieu nguoi dung upload, moi ban ghi thuoc ve mot tai khoan Supabase.';
comment on column public.documents.file_path is
  'Duong dan file trong bucket documents, khong luu signed URL.';
comment on column public.documents.chapter_id is
  'Chuong (trong bang public.chapters) ma tai lieu nay thuoc ve, co the de trong.
   Rang buoc khoa ngoai duoc gan sau trong migration tao bang chapters
   (20260808_tao_bang_chuong.sql) vi bang chapters chua ton tai luc nay.';

create index if not exists documents_user_updated_at_idx
  on public.documents (user_id, updated_at desc);

create index if not exists documents_user_project_idx
  on public.documents (user_id, project_id);

create index if not exists documents_chapter_idx
  on public.documents (chapter_id);

-- Tu dong cap nhat updated_at khi Document thay doi.
create or replace function public.cap_nhat_thoi_gian_tai_lieu()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_tai_lieu() from public;

drop trigger if exists cap_nhat_documents_updated_at on public.documents;
create trigger cap_nhat_documents_updated_at
  before update on public.documents
  for each row execute procedure public.cap_nhat_thoi_gian_tai_lieu();

-- Dam bao project_id/chapter_id gan vao Document phai thuoc ve dung tai
-- khoan dang thao tac (khong the gan nham lien ket sang tai khoan khac).
create or replace function public.kiem_tra_chu_so_huu_documents()
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

  if new.chapter_id is not null and not exists (
    select 1 from public.chapters
    where id = new.chapter_id and user_id = new.user_id
  ) then
    raise exception 'chapter_id khong thuoc ve tai khoan nay';
  end if;

  return new;
end;
$$;

revoke all on function public.kiem_tra_chu_so_huu_documents() from public;

drop trigger if exists kiem_tra_chu_so_huu_documents_trg on public.documents;
create trigger kiem_tra_chu_so_huu_documents_trg
  before insert or update on public.documents
  for each row execute procedure public.kiem_tra_chu_so_huu_documents();

-- Moi tai khoan chi truy cap Document cua chinh minh qua Supabase API.
alter table public.documents enable row level security;

grant select, insert, update, delete on table public.documents to authenticated;
grant all on table public.documents to service_role;
revoke all on table public.documents from anon;

drop policy if exists "Nguoi dung xem tai lieu cua minh" on public.documents;
create policy "Nguoi dung xem tai lieu cua minh"
on public.documents
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao tai lieu cua minh" on public.documents;
create policy "Nguoi dung tao tai lieu cua minh"
on public.documents
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat tai lieu cua minh" on public.documents;
create policy "Nguoi dung cap nhat tai lieu cua minh"
on public.documents
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa tai lieu cua minh" on public.documents;
create policy "Nguoi dung xoa tai lieu cua minh"
on public.documents
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Kho file tai lieu rieng tu, toi da 20 MB cho moi file.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'documents',
  'documents',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quy uoc duong dan: user_id/document_id/ten-file.
drop policy if exists "Nguoi dung xem file tai lieu cua minh" on storage.objects;
create policy "Nguoi dung xem file tai lieu cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai file tai lieu cua minh" on storage.objects;
create policy "Nguoi dung tai file tai lieu cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung cap nhat file tai lieu cua minh" on storage.objects;
create policy "Nguoi dung cap nhat file tai lieu cua minh"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung xoa file tai lieu cua minh" on storage.objects;
create policy "Nguoi dung xoa file tai lieu cua minh"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Bat Realtime de giao dien tu cap nhat danh sach tai lieu khi co
-- insert/update/delete, khong can bam tai lai trang.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table public.documents;
  end if;
end;
$$;
