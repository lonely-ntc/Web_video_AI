# Cài đặt bảng hồ sơ trên Supabase

1. Mở project trong Supabase Dashboard.
2. Chọn **SQL Editor** và tạo một truy vấn mới.
3. Sao chép toàn bộ nội dung file
   `migrations/20260723_tao_bang_ho_so.sql`.
4. Nhấn **Run**. Có thể chạy lại file này nếu bảng đã được tạo từ phiên bản cũ.

Sau khi chạy xong:

- Mỗi tài khoản có đúng một dòng trong bảng `public.profiles`.
- ID hồ sơ trùng với ID trong `auth.users`.
- Các cột email, họ tên, tên hiển thị, số điện thoại, công ty, vai trò và
  giới thiệu được hiển thị trong **Table Editor → public → profiles**.
- Bucket `avatars` được tạo trong Storage, giới hạn ảnh JPG/PNG/WebP tối đa 5 MB.
- URL và đường dẫn ảnh đại diện được lưu trong `avatar_url` và `avatar_path`.
- Người dùng chỉ được xem, tạo và cập nhật hồ sơ của chính mình.
- Tài khoản mới được tự động tạo hồ sơ sau khi đăng ký.
- Các tài khoản đã tồn tại cũng được tạo hồ sơ khi chạy migration.

## Cài đặt bảng Project

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_projects`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260731_tao_bang_du_an.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.projects` xuất hiện trong **Table Editor → public → projects**.
- Mỗi Project được liên kết với tài khoản tạo ra bằng cột `user_id`.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa Project của chính mình.
- Trạng thái Project gồm `draft`, `in_progress`, `completed` và `archived`.
- Tiến độ được giới hạn từ `0` đến `100`.
- Bucket riêng tư `project-covers` được tạo trong Storage.
- Ảnh bìa lưu theo đường dẫn `user_id/project_id/ten-file`.

## Cài đặt bảng Tài liệu

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_documents`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260804_tao_bang_tai_lieu.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.documents` xuất hiện trong **Table Editor → public → documents**.
- Mỗi tài liệu được liên kết với tài khoản upload bằng cột `user_id`, và có thể
  liên kết tùy chọn tới một Project qua cột `project_id`.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa tài liệu của chính mình.
- Loại file gồm `pdf`, `word`, `ppt`, `txt` và `md`.
- Trạng thái xử lý gồm `processing`, `ready` và `error`.
- Bucket riêng tư `documents` được tạo trong Storage, giới hạn 20 MB mỗi file.
- File tài liệu lưu theo đường dẫn `user_id/document_id/ten-file`.

## Cài đặt bảng Avatar AI

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_ai_avatars`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260805_tao_bang_ai_avatar.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.ai_avatars` xuất hiện trong **Table Editor → public → ai_avatars**.
- Mỗi Avatar được liên kết với tài khoản upload bằng cột `user_id`, và có thể
  liên kết tùy chọn tới một Project qua cột `project_id`.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa Avatar của chính mình.
- Mỗi tài khoản chỉ có tối đa một Avatar mặc định (`is_default`) tại một thời điểm.
- Bucket riêng tư `ai-avatars` được tạo trong Storage, giới hạn 10 MB mỗi ảnh
  (khác với bucket `avatars` dùng cho ảnh hồ sơ cá nhân).
- File Avatar lưu theo đường dẫn `user_id/avatar_id/ten-file`.

## Cài đặt bảng Video

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_videos`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260806_tao_bang_video.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.videos` xuất hiện trong **Table Editor → public → videos**.
- Mỗi video được liên kết với tài khoản upload bằng cột `user_id`, và có thể
  liên kết tùy chọn tới một Project qua cột `project_id`.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa video của chính mình.
- Trạng thái gồm `pending`, `rendering`, `completed` và `failed`.
- Bucket riêng tư `videos` được tạo trong Storage, giới hạn 500 MB mỗi video,
  hỗ trợ MP4/MOV/WebM.
- File video lưu theo đường dẫn `user_id/video_id/ten-file`.
- Thời lượng, độ phân giải và tỷ lệ khung hình được trích xuất tự động từ file
  ngay trên trình duyệt khi upload.

## Cài đặt bảng Lịch sử

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_lich_su`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260807_tao_bang_lich_su.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.tasks` xuất hiện trong **Table Editor → public → tasks**, lưu
  lịch sử từng tác vụ xử lý AI/render (liên kết tùy chọn tới `project_id` và
  `video_id`).
- Bảng `public.task_steps` lưu tiến trình từng bước pipeline (WF_00..WF_11)
  của mỗi tác vụ, liên kết qua `task_id`.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa lịch sử của chính mình
  (kể cả các bước pipeline con).
- Loại tác vụ gồm `video`, `docAnalysis`, `outline`, `script`, `image`,
  `voice`, `avatarVideo`, `render`, `saveResult`.
- Trạng thái gồm `pending`, `processing`, `completed`, `failed`, `cancelled`.
- Xóa một dòng lịch sử **không** xóa Project hoặc Video liên quan (chỉ set
  liên kết về null nếu Project/Video đó bị xóa).
- Hiện tại chưa có pipeline AI thực sự ghi log vào 2 bảng này — cần một
  worker/Edge Function tạo bản ghi `tasks` + `task_steps` khi tác vụ chạy để
  trang Lịch sử có dữ liệu thật.

## Cài đặt bảng Chương (trong Project)

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_chapters`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260808_tao_bang_chuong.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.chapters` xuất hiện trong **Table Editor → public → chapters**,
  mỗi chương thuộc về đúng một Project (`project_id`, xóa Project sẽ xóa theo
  các chương của nó).
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa chương của chính mình.
- Trạng thái gồm `not_started`, `creating_script`, `creating_video`, `completed`.
- Cột `document_count`/`video_count`/`progress` hiện là số đếm thủ công (giống
  cách bảng `projects` lưu `document_count`/`video_count`), chưa tự động đồng
  bộ với tài liệu/video thật — cần nối khi có luồng gán tài liệu/video vào
  từng chương.

## Mở rộng bảng Chương cho trang Chi tiết Chương

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `mo_rong_chapters`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260809_mo_rong_chuong.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn (dùng `add column if not exists`).

Sau khi chạy xong:

- Bảng `public.chapters` có thêm 3 cột: `script` (nội dung kịch bản),
  `selected_avatar_id` (liên kết tới `public.ai_avatars`, tự set về null nếu
  Avatar bị xóa) và `selected_voice_id` (text, vì hệ thống chưa có thư viện
  giọng nói thật).
- Bảng `public.documents` và `public.videos` có thêm cột `chapter_id` (tùy
  chọn, tự set về null nếu Chương bị xóa) để biết tài liệu/video nào thuộc
  chương nào.
- Trang **Chi tiết Chương** (bấm "Mở chương" từ trang Project) dùng các cột
  này để: upload tài liệu/video riêng cho từng chương, viết và lưu kịch bản,
  chọn Avatar AI thật từ thư viện của bạn, và ghi chú giọng đọc dự kiến sử
  dụng. Nút "Tạo Video" cuối trang hiện vẫn là placeholder vì hệ thống chưa
  có pipeline render thật.
