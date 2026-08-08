-- Mo rong bang chapters de luu kich ban, avatar/voice da chon cho tung chuong.
-- Them lien ket chapter_id (tuy chon) vao documents va videos de biet tai lieu/video
-- thuoc chuong nao trong Project.

alter table public.chapters
  add column if not exists script text not null default '',
  add column if not exists selected_avatar_id uuid references public.ai_avatars(id) on delete set null,
  add column if not exists selected_voice_id text not null default '';

comment on column public.chapters.script is
  'Noi dung kich ban van ban cua chuong.';
comment on column public.chapters.selected_avatar_id is
  'Avatar AI duoc chon de dung cho chuong nay.';

alter table public.documents
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

create index if not exists documents_chapter_idx
  on public.documents (chapter_id);

alter table public.videos
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

create index if not exists videos_chapter_idx
  on public.videos (chapter_id);
