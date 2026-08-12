-- Bang tasks luu lich su tac vu xu ly AI/render cua tung tai khoan Supabase.
-- Bang task_steps luu tien trinh pipeline (WF_00..WF_11) cua tung tac vu.
-- Xoa lich su khong duoc xoa Project hoac Video that (chi xoa/set null lien ket).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  video_id uuid references public.videos(id) on delete set null,
  code text not null,
  name text not null,
  type text not null,
  status text not null default 'pending',
  progress smallint not null default 0,
  has_video boolean not null default false,
  error jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint tasks_name_not_blank
    check (char_length(btrim(name)) between 1 and 150),
  constraint tasks_type_valid
    check (type in (
      'video', 'docAnalysis', 'outline', 'script',
      'image', 'voice', 'avatarVideo', 'render', 'saveResult'
    )),
  constraint tasks_status_valid
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  constraint tasks_progress_valid
    check (progress between 0 and 100)
);

comment on table public.tasks is
  'Lich su tac vu xu ly AI / render video, moi ban ghi thuoc ve mot tai khoan Supabase.';

create unique index if not exists tasks_user_code_idx
  on public.tasks (user_id, code);

create index if not exists tasks_user_started_at_idx
  on public.tasks (user_id, started_at desc);

create index if not exists tasks_user_status_idx
  on public.tasks (user_id, status);

create index if not exists tasks_user_project_idx
  on public.tasks (user_id, project_id);

create or replace function public.cap_nhat_thoi_gian_task()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_task() from public;

drop trigger if exists cap_nhat_tasks_updated_at on public.tasks;
create trigger cap_nhat_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.cap_nhat_thoi_gian_task();

-- Dam bao project_id/video_id gan vao Task phai thuoc ve dung tai khoan
-- dang thao tac (khong the gan nham lien ket sang tai khoan khac).
create or replace function public.kiem_tra_chu_so_huu_tasks()
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

  if new.video_id is not null and not exists (
    select 1 from public.videos
    where id = new.video_id and user_id = new.user_id
  ) then
    raise exception 'video_id khong thuoc ve tai khoan nay';
  end if;

  return new;
end;
$$;

revoke all on function public.kiem_tra_chu_so_huu_tasks() from public;

drop trigger if exists kiem_tra_chu_so_huu_tasks_trg on public.tasks;
create trigger kiem_tra_chu_so_huu_tasks_trg
  before insert or update on public.tasks
  for each row execute procedure public.kiem_tra_chu_so_huu_tasks();

alter table public.tasks enable row level security;

grant select, insert, update, delete on table public.tasks to authenticated;
grant all on table public.tasks to service_role;
revoke all on table public.tasks from anon;

drop policy if exists "Nguoi dung xem tac vu cua minh" on public.tasks;
create policy "Nguoi dung xem tac vu cua minh"
on public.tasks
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao tac vu cua minh" on public.tasks;
create policy "Nguoi dung tao tac vu cua minh"
on public.tasks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat tac vu cua minh" on public.tasks;
create policy "Nguoi dung cap nhat tac vu cua minh"
on public.tasks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa tac vu cua minh" on public.tasks;
create policy "Nguoi dung xoa tac vu cua minh"
on public.tasks
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Cac buoc pipeline (WF_00..WF_11) cua tung tac vu.
create table if not exists public.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  step_index smallint not null,
  code text not null,
  name text not null,
  status text not null default 'notRun',
  started_at timestamptz,
  finished_at timestamptz,
  duration_seconds numeric not null default 0,
  message text not null default '',

  constraint task_steps_status_valid
    check (status in ('notRun', 'pending', 'processing', 'completed', 'failed')),
  constraint task_steps_step_index_valid
    check (step_index >= 0),
  constraint task_steps_task_step_unique
    unique (task_id, step_index)
);

comment on table public.task_steps is
  'Tien trinh tung buoc pipeline cua mot tac vu trong bang tasks.';

create index if not exists task_steps_task_id_idx
  on public.task_steps (task_id, step_index);

alter table public.task_steps enable row level security;

grant select, insert, update, delete on table public.task_steps to authenticated;
grant all on table public.task_steps to service_role;
revoke all on table public.task_steps from anon;

drop policy if exists "Nguoi dung xem buoc cua tac vu minh" on public.task_steps;
create policy "Nguoi dung xem buoc cua tac vu minh"
on public.task_steps
for select
to authenticated
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_steps.task_id
      and tasks.user_id = (select auth.uid())
  )
);

drop policy if exists "Nguoi dung tao buoc cho tac vu minh" on public.task_steps;
create policy "Nguoi dung tao buoc cho tac vu minh"
on public.task_steps
for insert
to authenticated
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_steps.task_id
      and tasks.user_id = (select auth.uid())
  )
);

drop policy if exists "Nguoi dung cap nhat buoc cua tac vu minh" on public.task_steps;
create policy "Nguoi dung cap nhat buoc cua tac vu minh"
on public.task_steps
for update
to authenticated
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_steps.task_id
      and tasks.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_steps.task_id
      and tasks.user_id = (select auth.uid())
  )
);

drop policy if exists "Nguoi dung xoa buoc cua tac vu minh" on public.task_steps;
create policy "Nguoi dung xoa buoc cua tac vu minh"
on public.task_steps
for delete
to authenticated
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_steps.task_id
      and tasks.user_id = (select auth.uid())
  )
);

-- Bat Realtime de trang Lich su tu cap nhat tien trinh tac vu/pipeline khi
-- co insert/update/delete, khong can bam tai lai trang.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_steps'
  ) then
    alter publication supabase_realtime add table public.task_steps;
  end if;
end;
$$;
