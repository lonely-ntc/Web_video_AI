-- Bucket pptx: luu file PowerPoint (.pptx) do pipeline automation (Make.com)
-- xuat ra tu noi dung slide cua kich ban. Giong cach bucket "videos" hoat
-- dong: private, quy uoc duong dan user_id/... , RLS gioi han theo tai
-- khoan so huu.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'pptx',
  'pptx',
  false,
  52428800,
  array['application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quy uoc duong dan: user_id/chapter_id/ten-file.pptx
drop policy if exists "Nguoi dung xem file pptx cua minh" on storage.objects;
create policy "Nguoi dung xem file pptx cua minh"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pptx'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung tai file pptx cua minh" on storage.objects;
create policy "Nguoi dung tai file pptx cua minh"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pptx'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung cap nhat file pptx cua minh" on storage.objects;
create policy "Nguoi dung cap nhat file pptx cua minh"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pptx'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'pptx'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Nguoi dung xoa file pptx cua minh" on storage.objects;
create policy "Nguoi dung xoa file pptx cua minh"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pptx'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
