-- Bang voice_audio luu file am thanh giong doc DA DUOC XAC NHAN de dung cho
-- video cua tung Chuong (goi tu VieNeu-TTS qua tts-service). Cac lan "Nghe
-- thu" trong wizard Tao Video AI chi phat tam thoi o trinh duyet, KHONG
-- luu vao bang nay va KHONG upload len Storage - chi khi nguoi dung xac
-- nhan chon giong de dung that thi moi luu.

create table if not exists public.voice_audio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  voice_id text not null,
  voice_name text not null,
  gender text not null default 'unknown',
  region text not null default 'unknown',
  file_path text not null,
  duration_seconds numeric not null default 0,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),

  constraint voice_audio_voice_id_not_blank
    check (char_length(btrim(voice_id)) > 0),
  constraint voice_audio_duration_valid
    check (duration_seconds >= 0),
  constraint voice_audio_size_bytes_valid
    check (size_bytes >= 0)
);

comment on table public.voice_audio is
  'Am thanh giong doc VieNeu-TTS da duoc nguoi dung xac nhan de dung cho video cua mot Chuong. Ban nghe thu khong luu o day.';

create index if not exists voice_audio_user_idx
  on public.voice_audio (user_id);

create index if not exists voice_audio_chapter_created_idx
  on public.voice_audio (chapter_id, created_at desc);

-- Dam bao project_id/chapter_id gan vao voice_audio phai thuoc ve dung
-- tai khoan dang thao tac (khong the gan nham lien ket sang tai khoan khac).
create or replace function public.kiem_tra_chu_so_huu_voice_audio()
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

revoke all on function public.kiem_tra_chu_so_huu_voice_audio() from public;

drop trigger if exists kiem_tra_chu_so_huu_voice_audio_trg on public.voice_audio;
create trigger kiem_tra_chu_so_huu_voice_audio_trg
  before insert or update on public.voice_audio
  for each row execute procedure public.kiem_tra_chu_so_huu_voice_audio();

alter table public.voice_audio enable row level security;

grant select, insert, update, delete on table public.voice_audio to authenticated;
grant all on table public.voice_audio to service_role;
revoke all on table public.voice_audio from anon;

drop policy if exists "Nguoi dung xem am thanh giong doc cua minh" on public.voice_audio;
create policy "Nguoi dung xem am thanh giong doc cua minh"
on public.voice_audio
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung tao am thanh giong doc cua minh" on public.voice_audio;
create policy "Nguoi dung tao am thanh giong doc cua minh"
on public.voice_audio
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung cap nhat am thanh giong doc cua minh" on public.voice_audio;
create policy "Nguoi dung cap nhat am thanh giong doc cua minh"
on public.voice_audio
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Nguoi dung xoa am thanh giong doc cua minh" on public.voice_audio;
create policy "Nguoi dung xoa am thanh giong doc cua minh"
on public.voice_audio
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Kho file am thanh giong doc rieng tu, toi da 20 MB cho moi file.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'voice-audio',
  'voice-audio',
  false,
  20971520,
  array['audio/wav', 'audio/x-wav', 'audio/wave']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quy uoc duong dan: user_id/chapter_id/ten-file.
drop policy if exists "Nguoi dung xem file am thanh cua minh" on storage.objects;
create policy "Nguoi dung xem file am thanh cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'voice-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai file am thanh cua minh" on storage.objects;
create policy "Nguoi dung tai file am thanh cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'voice-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung xoa file am thanh cua minh" on storage.objects;
create policy "Nguoi dung xoa file am thanh cua minh"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'voice-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Bat Realtime de Chi tiet Chuong / wizard tao video thay am thanh giong
-- doc moi ngay khi luu xong.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voice_audio'
  ) then
    alter publication supabase_realtime add table public.voice_audio;
  end if;
end;
$$;
