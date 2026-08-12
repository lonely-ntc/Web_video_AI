-- Bang chapters luu cac chuong ben trong mot Project (vi du khoa hoc nhieu chuong).
-- Moi chuong thuoc ve dung mot Project va mot tai khoan Supabase.

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  order_index smallint not null default 0,
  document_count integer not null default 0,
  video_count integer not null default 0,
  progress smallint not null default 0,
  status text not null default 'not_started',
  script text not null default '',
  selected_avatar_id uuid references public.ai_avatars(id) on delete set null,
  selected_voice_id text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint chapters_name_not_blank
    check (char_length(btrim(name)) between 1 and 150),
  constraint chapters_description_length
    check (char_length(description) <= 300),
  constraint chapters_status_valid
    check (status in ('not_started', 'creating_script', 'creating_video', 'completed')),
  constraint chapters_progress_valid
    check (progress between 0 and 100),
  constraint chapters_document_count_valid
    check (document_count >= 0),
  constraint chapters_video_count_valid
    check (video_count >= 0)
);

comment on table public.chapters is
  'Chuong ben trong mot Project, moi ban ghi thuoc ve mot tai khoan Supabase.';
comment on column public.chapters.script is
  'Noi dung kich ban van ban cua chuong.';
comment on column public.chapters.selected_avatar_id is
  'Avatar AI duoc chon de dung cho chuong nay.';
comment on column public.chapters.selected_voice_id is
  'Ma/ten giong doc du kien dung cho chuong nay (chua co thu vien giong that).';

-- Neu bang chapters da duoc tao tu ban truoc khi 3 cot nay ton tai thi van
-- them vao an toan (khong lam gi neu da co san).
alter table public.chapters
  add column if not exists script text not null default '',
  add column if not exists selected_avatar_id uuid references public.ai_avatars(id) on delete set null,
  add column if not exists selected_voice_id text not null default '';

create index if not exists chapters_project_order_idx
  on public.chapters (project_id, order_index);

create index if not exists chapters_user_idx
  on public.chapters (user_id);

create or replace function public.cap_nhat_thoi_gian_chuong()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_chuong() from public;

drop trigger if exists cap_nhat_chapters_updated_at on public.chapters;
create trigger cap_nhat_chapters_updated_at
  before update on public.chapters
  for each row execute procedure public.cap_nhat_thoi_gian_chuong();

-- Dam bao project_id/selected_avatar_id gan vao Chuong phai thuoc ve dung
-- tai khoan dang thao tac (khong the gan nham lien ket sang tai khoan khac).
create or replace function public.kiem_tra_chu_so_huu_chapters()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.projects
    where id = new.project_id and user_id = new.user_id
  ) then
    raise exception 'project_id khong thuoc ve tai khoan nay';
  end if;

  if new.selected_avatar_id is not null and not exists (
    select 1 from public.ai_avatars
    where id = new.selected_avatar_id and user_id = new.user_id
  ) then
    raise exception 'selected_avatar_id khong thuoc ve tai khoan nay';
  end if;

  return new;
end;
$$;

revoke all on function public.kiem_tra_chu_so_huu_chapters() from public;

drop trigger if exists kiem_tra_chu_so_huu_chapters_trg on public.chapters;
create trigger kiem_tra_chu_so_huu_chapters_trg
  before insert or update on public.chapters
  for each row execute procedure public.kiem_tra_chu_so_huu_chapters();

alter table public.chapters enable row level security;

grant select, insert, update, delete on table public.chapters to authenticated;
grant all on table public.chapters to service_role;
revoke all on table public.chapters from anon;

drop policy if exists "Nguoi dung xem chuong cua minh" on public.chapters;
create policy "Nguoi dung xem chuong cua minh"
on public.chapters
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao chuong cua minh" on public.chapters;
create policy "Nguoi dung tao chuong cua minh"
on public.chapters
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat chuong cua minh" on public.chapters;
create policy "Nguoi dung cap nhat chuong cua minh"
on public.chapters
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa chuong cua minh" on public.chapters;
create policy "Nguoi dung xoa chuong cua minh"
on public.chapters
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Gan khoa ngoai documents.chapter_id -> chapters.id, vi cot chapter_id da
-- duoc tao san trong 20260804_tao_bang_tai_lieu.sql nhung chua the tham chieu
-- toi bang chapters luc do (bang chapters chua ton tai).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'documents_chapter_id_fkey'
  ) then
    alter table public.documents
      add constraint documents_chapter_id_fkey
      foreign key (chapter_id) references public.chapters(id) on delete set null;
  end if;
end $$;

-- Them lien ket chapter_id (tuy chon) vao videos de biet video nao thuoc
-- chuong nao trong Project.
alter table public.videos
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

create index if not exists videos_chapter_idx
  on public.videos (chapter_id);

-- Cap nhat lai ham kiem tra chu so huu cua videos (tao o
-- 20260806_tao_bang_video.sql) de kiem tra them chapter_id, vi cot nay
-- vua duoc them vao o buoc tren.
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

  if new.chapter_id is not null and not exists (
    select 1 from public.chapters
    where id = new.chapter_id and user_id = new.user_id
  ) then
    raise exception 'chapter_id khong thuoc ve tai khoan nay';
  end if;

  return new;
end;
$$;
