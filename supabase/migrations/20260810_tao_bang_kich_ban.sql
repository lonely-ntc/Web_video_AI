-- Bang scripts luu cac kich ban duoc AI tao ra cho tung Chuong.
-- Khac voi cot chapters.script (chi luu ban kich ban hien hanh de hien thi
-- nhanh), bang nay luu lai LICH SU cac lan tao/tao lai kich ban bang AI
-- (moi lan tao moi la mot phien ban), phuc vu xem lai/so sanh sau nay.

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  content text not null default '',
  version integer not null default 1,
  status text not null default 'draft',
  source text not null default 'ai',
  word_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint scripts_status_valid
    check (status in ('draft', 'generating', 'completed', 'failed')),
  constraint scripts_version_valid
    check (version >= 1),
  constraint scripts_word_count_valid
    check (word_count >= 0)
);

comment on table public.scripts is
  'Lich su kich ban do AI tao cho tung Chuong, moi ban ghi thuoc ve mot tai khoan Supabase.';
comment on column public.scripts.version is
  'So thu tu phien ban kich ban trong cung mot Chuong, tang dan moi lan AI tao lai.';
comment on column public.scripts.source is
  'Nguon tao kich ban, vi du: ai, manual.';
comment on column public.scripts.status is
  'Trang thai xu ly kich ban: draft, generating, completed, failed.';

create index if not exists scripts_chapter_version_idx
  on public.scripts (chapter_id, version desc);

create index if not exists scripts_user_idx
  on public.scripts (user_id);

create index if not exists scripts_project_idx
  on public.scripts (project_id);

-- Tu dong cap nhat updated_at khi kich ban thay doi.
create or replace function public.cap_nhat_thoi_gian_kich_ban()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.cap_nhat_thoi_gian_kich_ban() from public;

drop trigger if exists cap_nhat_scripts_updated_at on public.scripts;
create trigger cap_nhat_scripts_updated_at
  before update on public.scripts
  for each row execute procedure public.cap_nhat_thoi_gian_kich_ban();

-- Moi tai khoan chi truy cap kich ban cua chinh minh qua Supabase API.
-- Dam bao project_id/chapter_id gan vao kich ban phai thuoc ve dung tai
-- khoan dang thao tac (khong the gan nham lien ket sang tai khoan khac).
create or replace function public.kiem_tra_chu_so_huu_scripts()
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

revoke all on function public.kiem_tra_chu_so_huu_scripts() from public;

drop trigger if exists kiem_tra_chu_so_huu_scripts_trg on public.scripts;
create trigger kiem_tra_chu_so_huu_scripts_trg
  before insert or update on public.scripts
  for each row execute procedure public.kiem_tra_chu_so_huu_scripts();

alter table public.scripts enable row level security;

grant select, insert, update, delete on table public.scripts to authenticated;
grant all on table public.scripts to service_role;
revoke all on table public.scripts from anon;

drop policy if exists "Nguoi dung xem kich ban cua minh" on public.scripts;
create policy "Nguoi dung xem kich ban cua minh"
on public.scripts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao kich ban cua minh" on public.scripts;
create policy "Nguoi dung tao kich ban cua minh"
on public.scripts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat kich ban cua minh" on public.scripts;
create policy "Nguoi dung cap nhat kich ban cua minh"
on public.scripts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa kich ban cua minh" on public.scripts;
create policy "Nguoi dung xoa kich ban cua minh"
on public.scripts
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Bat Realtime de Chi tiet Chuong thay kich ban AI moi ngay khi tao xong,
-- ke ca dang mo o tab/thiet bi khac.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scripts'
  ) then
    alter publication supabase_realtime add table public.scripts;
  end if;
end;
$$;
