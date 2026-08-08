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
