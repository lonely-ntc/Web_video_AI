-- Bang video_jobs theo doi tien trinh tao video cua pipeline (web + Make.com).
-- Web tao ban ghi khi bam "Bat dau tao Video"; Make cap nhat cot stage/status
-- (bang service_role) sau moi buoc; web lang nghe Realtime de hien tien trinh.

create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  stage text not null default 'script',
  status text not null default 'running',
  error_message text,
  video_url text,
  pptx_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint video_jobs_stage_valid
    check (stage in ('script', 'voice', 'avatar', 'merge', 'save')),
  constraint video_jobs_status_valid
    check (status in ('running', 'completed', 'failed'))
);

comment on table public.video_jobs is
  'Tien trinh tao video: stage = buoc dang chay, status = running/completed/failed.';
comment on column public.video_jobs.pptx_path is
  'Duong dan file .pptx trong bucket pptx (user_id/chapter_id/ten-file).';

create index if not exists video_jobs_user_created_at_idx
  on public.video_jobs (user_id, created_at desc);

create or replace function public.cap_nhat_thoi_gian_video_jobs()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_video_jobs() from public;

drop trigger if exists cap_nhat_video_jobs_updated_at on public.video_jobs;
create trigger cap_nhat_video_jobs_updated_at
  before update on public.video_jobs
  for each row execute procedure public.cap_nhat_thoi_gian_video_jobs();

alter table public.video_jobs enable row level security;

grant select, insert, update on table public.video_jobs to authenticated;
grant all on table public.video_jobs to service_role;
revoke all on table public.video_jobs from anon;

drop policy if exists "Nguoi dung xem job cua minh" on public.video_jobs;
create policy "Nguoi dung xem job cua minh"
on public.video_jobs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao job cua minh" on public.video_jobs;
create policy "Nguoi dung tao job cua minh"
on public.video_jobs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat job cua minh" on public.video_jobs;
create policy "Nguoi dung cap nhat job cua minh"
on public.video_jobs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'video_jobs'
  ) then
    alter publication supabase_realtime add table public.video_jobs;
  end if;
end;
$$;
