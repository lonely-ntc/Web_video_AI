-- Bang videos luu video da xuat cua tung tai khoan Supabase.
-- File video duoc luu trong bucket videos, bang chi luu duong dan.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  file_path text not null default '',
  duration_seconds numeric not null default 0,
  resolution text,
  aspect_ratio text,
  fps integer,
  format text,
  size_bytes bigint not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  rendered_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),

  constraint videos_name_not_blank
    check (char_length(btrim(name)) between 1 and 150),
  constraint videos_status_valid
    check (status in ('pending', 'rendering', 'completed', 'failed')),
  constraint videos_size_bytes_valid
    check (size_bytes >= 0)
);

comment on table public.videos is
  'Video da xuat, moi ban ghi thuoc ve mot tai khoan Supabase.';
comment on column public.videos.file_path is
  'Duong dan file trong bucket videos, khong luu signed URL.';

create index if not exists videos_user_updated_at_idx
  on public.videos (user_id, updated_at desc);

create index if not exists videos_user_project_idx
  on public.videos (user_id, project_id);

create index if not exists videos_user_status_idx
  on public.videos (user_id, status);

-- Tu dong cap nhat updated_at khi Video thay doi.
create or replace function public.cap_nhat_thoi_gian_video()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_video() from public;

drop trigger if exists cap_nhat_videos_updated_at on public.videos;
create trigger cap_nhat_videos_updated_at
  before update on public.videos
  for each row execute procedure public.cap_nhat_thoi_gian_video();

-- Dam bao project_id gan vao Video phai thuoc ve dung tai khoan dang thao
-- tac. Ham nay se duoc cap nhat them dieu kien kiem tra chapter_id trong
-- migration tao bang chapters (20260808_tao_bang_chuong.sql), vi cot
-- videos.chapter_id chi duoc them vao o buoc do.
create or replace function public.kiem_tra_chu_so_huu_videos()
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

revoke all on function public.kiem_tra_chu_so_huu_videos() from public;

drop trigger if exists kiem_tra_chu_so_huu_videos_trg on public.videos;
create trigger kiem_tra_chu_so_huu_videos_trg
  before insert or update on public.videos
  for each row execute procedure public.kiem_tra_chu_so_huu_videos();

-- Moi tai khoan chi truy cap Video cua chinh minh qua Supabase API.
alter table public.videos enable row level security;

grant select, insert, update, delete on table public.videos to authenticated;
grant all on table public.videos to service_role;
revoke all on table public.videos from anon;

drop policy if exists "Nguoi dung xem video cua minh" on public.videos;
create policy "Nguoi dung xem video cua minh"
on public.videos
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao video cua minh" on public.videos;
create policy "Nguoi dung tao video cua minh"
on public.videos
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat video cua minh" on public.videos;
create policy "Nguoi dung cap nhat video cua minh"
on public.videos
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa video cua minh" on public.videos;
create policy "Nguoi dung xoa video cua minh"
on public.videos
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Kho file video rieng tu, toi da 500 MB cho moi video.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'videos',
  'videos',
  false,
  524288000,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quy uoc duong dan: user_id/video_id/ten-file.
drop policy if exists "Nguoi dung xem file video cua minh" on storage.objects;
create policy "Nguoi dung xem file video cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai file video cua minh" on storage.objects;
create policy "Nguoi dung tai file video cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung cap nhat file video cua minh" on storage.objects;
create policy "Nguoi dung cap nhat file video cua minh"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung xoa file video cua minh" on storage.objects;
create policy "Nguoi dung xoa file video cua minh"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Bat Realtime de giao dien tu cap nhat danh sach video khi co
-- insert/update/delete, khong can bam tai lai trang.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'videos'
  ) then
    alter publication supabase_realtime add table public.videos;
  end if;
end;
$$;
