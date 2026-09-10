-- Bo sung cot `slides` vao bang scripts.
-- Moi lan AI tao kich ban, no dong thoi tao luon NOI DUNG SLIDE PPT tuong ung
-- (tieu de + gach dau dong + loi thoai tung slide). Luu chung mot ban ghi de
-- kich ban va bo slide luon khop phien ban voi nhau.
--
-- Cau truc mot phan tu trong mang `slides` (khop voi
-- local-ai/ppt-service/lib/xayDungBaiGiang.js):
--   { "type": "title" | "section" | "content" | "summary",
--     "title": "...", "subtitle"?: "...",
--     "bullets"?: ["..."], "note"?: "loi thoai cho slide nay" }

alter table public.scripts
  add column if not exists slides jsonb not null default '[]'::jsonb;

comment on column public.scripts.slides is
  'Noi dung slide PPT do AI tao kem theo kich ban (mang JSON cac slide). '
  'Dung de sinh file .pptx qua ppt-service.';
