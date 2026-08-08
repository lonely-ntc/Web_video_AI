-- Bang projects luu du an rieng cua tung tai khoan Supabase.
-- Anh bia duoc luu trong bucket project-covers, bang chi luu duong dan.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'other',
  default_language text not null default 'vi',
  video_template text not null default 'basic',
  cover_path text not null default '',
  default_settings_enabled boolean not null default false,
  default_avatar_id text not null default '',
  default_voice_id text not null default '',
  aspect_ratio text,
  resolution text,
  status text not null default 'in_progress',
  progress smallint not null default 0,
  document_count integer not null default 0,
  video_count integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint projects_name_not_blank
    check (char_length(btrim(name)) between 1 and 100),
  constraint projects_description_length
    check (char_length(description) <= 300),
  constraint projects_category_valid
    check (category in ('education', 'technology', 'marketing', 'business', 'other')),
  constraint projects_language_valid
    check (default_language in ('vi', 'en')),
  constraint projects_template_valid
    check (video_template in ('basic', 'presentation', 'social', 'training')),
  constraint projects_aspect_ratio_valid
    check (aspect_ratio is null or aspect_ratio in ('16:9', '9:16', '1:1')),
  constraint projects_resolution_valid
    check (resolution is null or resolution in ('720p', '1080p', '2160p')),
  constraint projects_status_valid
    check (status in ('draft', 'in_progress', 'completed', 'archived')),
  constraint projects_progress_valid
    check (progress between 0 and 100),
  constraint projects_document_count_valid
    check (document_count >= 0),
  constraint projects_video_count_valid
    check (video_count >= 0)
);

alter table public.projects
  alter column status set default 'in_progress';

comment on table public.projects is
  'Du an tao video AI, moi ban ghi thuoc ve mot tai khoan Supabase.';
comment on column public.projects.cover_path is
  'Duong dan anh bia trong bucket project-covers, khong luu signed URL.';
comment on column public.projects.status is
  'Trang thai: draft, in_progress, completed hoac archived.';

create index if not exists projects_user_updated_at_idx
  on public.projects (user_id, updated_at desc);

create index if not exists projects_user_status_idx
  on public.projects (user_id, status);

-- Tu dong cap nhat updated_at khi Project thay doi.
create or replace function public.cap_nhat_thoi_gian_du_an()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_du_an() from public;

drop trigger if exists cap_nhat_projects_updated_at on public.projects;
create trigger cap_nhat_projects_updated_at
  before update on public.projects
  for each row execute procedure public.cap_nhat_thoi_gian_du_an();

-- Moi tai khoan chi truy cap Project cua chinh minh qua Supabase API.
alter table public.projects enable row level security;

grant select, insert, update, delete on table public.projects to authenticated;
grant all on table public.projects to service_role;
revoke all on table public.projects from anon;

drop policy if exists "Nguoi dung xem du an cua minh" on public.projects;
create policy "Nguoi dung xem du an cua minh"
on public.projects
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao du an cua minh" on public.projects;
create policy "Nguoi dung tao du an cua minh"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat du an cua minh" on public.projects;
create policy "Nguoi dung cap nhat du an cua minh"
on public.projects
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa du an cua minh" on public.projects;
create policy "Nguoi dung xoa du an cua minh"
on public.projects
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Kho anh bia Project rieng tu, toi da 10 MB cho moi anh.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-covers',
  'project-covers',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quy uoc duong dan: user_id/project_id/ten-file.
drop policy if exists "Nguoi dung xem anh bia du an cua minh" on storage.objects;
create policy "Nguoi dung xem anh bia du an cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai anh bia du an cua minh" on storage.objects;
create policy "Nguoi dung tai anh bia du an cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung cap nhat anh bia du an cua minh" on storage.objects;
create policy "Nguoi dung cap nhat anh bia du an cua minh"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung xoa anh bia du an cua minh" on storage.objects;
create policy "Nguoi dung xoa anh bia du an cua minh"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
