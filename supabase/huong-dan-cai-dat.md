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
- Mỗi tài liệu được liên kết với tài khoản upload bằng cột `user_id`, có thể
  liên kết tùy chọn tới một Project qua cột `project_id` và tới một Chương qua
  cột `chapter_id`.
- Cột `chapter_id` chưa có khóa ngoại ngay ở bước này vì bảng `chapters` chưa
  tồn tại — khóa ngoại được gán tự động khi bạn chạy migration tạo bảng Chương
  (`20260808_tao_bang_chuong.sql`) ở bước sau. Nếu bạn chỉ cài bảng Tài liệu mà
  chưa cần tính năng Chương thì vẫn dùng được bình thường, cột này chỉ để trống.
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
- Bảng `chapters` có sẵn 3 cột phục vụ trang Chi tiết Chương: `script` (nội
  dung kịch bản), `selected_avatar_id` (liên kết tới `public.ai_avatars`, tự
  set về null nếu Avatar bị xóa) và `selected_voice_id` (text, vì hệ thống
  chưa có thư viện giọng nói thật).
- File này cũng tự động gán khóa ngoại cho cột `documents.chapter_id` (đã tạo
  sẵn ở bước "Cài đặt bảng Tài liệu") trỏ tới `chapters.id` — vì lúc tạo bảng
  Tài liệu, bảng Chương chưa tồn tại nên chưa thể gán khóa ngoại ngay.
- Bảng `public.videos` có thêm cột `chapter_id` (tùy chọn, tự set về null nếu
  Chương bị xóa) để biết video nào thuộc chương nào.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa chương của chính mình.
- Trạng thái gồm `not_started`, `creating_script`, `creating_video`, `completed`.
- Cột `document_count`/`video_count`/`progress` hiện là số đếm thủ công (giống
  cách bảng `projects` lưu `document_count`/`video_count`), chưa tự động đồng
  bộ với tài liệu/video thật — cần nối khi có luồng gán tài liệu/video vào
  từng chương.
- Trang **Chi tiết Chương** (bấm "Mở chương" từ trang Project) dùng các cột
  này để: upload tài liệu/video riêng cho từng chương, viết và lưu kịch bản,
  chọn Avatar AI thật từ thư viện của bạn, và ghi chú giọng đọc dự kiến sử
  dụng. Nút "Tạo Video" cuối trang hiện vẫn là placeholder vì hệ thống chưa
  có pipeline render thật.

## Cài đặt bảng Kịch bản (do AI tạo)

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_scripts`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260810_tao_bang_kich_ban.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.scripts` xuất hiện trong **Table Editor → public → scripts**,
  lưu lại **lịch sử từng phiên bản kịch bản** do AI tạo cho mỗi Chương (khác
  với cột `chapters.script` chỉ lưu đúng 1 bản hiện hành để hiển thị nhanh).
- Mỗi kịch bản gắn với `chapter_id`, `project_id`, có số `version` tăng dần
  mỗi lần AI tạo lại, cột `word_count` (số từ, tự tính khi lưu) và `source`
  (mặc định `ai`, có thể là `manual` nếu người dùng tự viết).
- Trạng thái gồm `draft`, `generating`, `completed`, `failed`.
- Người dùng đăng nhập chỉ có thể đọc, tạo, sửa và xóa kịch bản của chính mình.
- Trang **Chi tiết Chương** hiển thị kịch bản mới nhất từ bảng này (nếu có),
  kèm nút xem lịch sử các phiên bản cũ và xóa từng phiên bản.

## Cài đặt bảng Âm thanh giọng đọc (VieNeu-TTS)

1. Trong **SQL Editor**, tạo một truy vấn mới.
2. Đặt tên truy vấn là `tao_bang_voice_audio`.
3. Sao chép toàn bộ nội dung file
   `migrations/20260814_tao_bang_am_thanh_giong_doc.sql`.
4. Nhấn **Run**. File có thể chạy lại an toàn khi cần cập nhật policy.

Sau khi chạy xong:

- Bảng `public.voice_audio` xuất hiện trong **Table Editor → public → voice_audio**,
  lưu file âm thanh giọng đọc (VieNeu-TTS) **đã được người dùng xác nhận
  dùng cho video** của một Chương.
- Bucket Storage `voice-audio` (riêng tư, tối đa 20 MB, chỉ nhận `.wav`)
  được tạo để lưu file thật, đường dẫn theo quy ước `user_id/chapter_id/...`.
- **Quan trọng:** các lần bấm "Nghe thử" trong wizard Tạo Video AI **không**
  lưu vào bảng này và **không** upload lên Storage — chỉ phát tạm thời ở
  trình duyệt (qua `URL.createObjectURL`). Chỉ khi người dùng bấm **"Chọn
  giọng này"** (xác nhận dùng cho video thật) hệ thống mới gọi lại
  `tts-service` để tạo âm thanh từ **toàn bộ kịch bản** rồi lưu lên Supabase.
- Người dùng đăng nhập chỉ có thể đọc/tạo/sửa/xóa âm thanh giọng đọc của
  chính mình (RLS + trigger kiểm tra `project_id`/`chapter_id` cùng tài khoản).

## Cài đặt Edge Function tạo kịch bản bằng OpenAI

Nút **"Tạo kịch bản bằng AI"** ở trang Chi tiết Chương gọi một Supabase Edge
Function (`supabase/functions/generate-script/index.ts`) để gọi OpenAI thay
vì gọi trực tiếp từ trình duyệt (tránh lộ API key). Function này chạy bằng
chính JWT của người dùng đang đăng nhập (không dùng `service_role`), nên mọi
truy vấn/tải tài liệu/lưu kịch bản đều tự động bị giới hạn đúng theo tài
khoản đó qua RLS.

Cần cài đặt [Supabase CLI](https://supabase.com/docs/guides/cli), sau đó:

1. Đăng nhập và liên kết project:
   ```
   supabase login
   supabase link --project-ref <ma-project-cua-ban>
   ```
2. Thiết lập secret chứa API key OpenAI (chỉ cần làm một lần):
   ```
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
3. Triển khai function:
   ```
   supabase functions deploy generate-script
   ```

Lưu ý:

- Hiện tại function chỉ đọc được nội dung tài liệu dạng `.txt` hoặc `.md`.
  Nếu Chương chưa có tài liệu nào thuộc 2 định dạng này (kể cả khi đã upload
  PDF/Word/PowerPoint), nút sẽ báo lỗi rõ ràng thay vì tạo kịch bản rỗng.
- Mỗi lần bấm nút sẽ tạo một **phiên bản kịch bản mới** trong bảng
  `public.scripts`, không ghi đè phiên bản cũ.

## Realtime (tự động cập nhật giao diện)

Không phải một bước cài đặt riêng — mỗi file migration của Tài liệu, Avatar
AI, Video, Lịch sử và Kịch bản ở trên đã **có sẵn** lệnh bật Realtime
(`alter publication supabase_realtime add table ...`) ngay trong đó, tự chạy
khi bạn `Run` file như hướng dẫn ở từng mục. Không cần chạy thêm gì.

Nhờ vậy các bảng `documents`, `ai_avatars`, `videos`, `tasks`, `task_steps`,
`scripts` tự phát sự kiện khi có insert/update/delete, giúp giao diện cập
nhật ngay mà không cần bấm tải lại trang (trang Tài liệu/Avatar/Video, mục
tương ứng ở Chi tiết Chương, trang Lịch sử tiến trình pipeline). Realtime
vẫn tuân theo RLS của từng bảng — người dùng chỉ nhận được sự kiện của đúng
dữ liệu họ được phép xem, không cần cấu hình bảo mật thêm.

## Kiểm tra chủ sở hữu chéo giữa các bảng (bảo mật bổ sung)

Không phải một bước cài đặt riêng — mỗi file migration ở trên (Tài liệu,
Avatar AI, Video, Lịch sử, Chương, Kịch bản) đã **có sẵn** một trigger
`kiem_tra_chu_so_huu_...` ngay trong đó, tự chạy khi bạn `Run` file như
hướng dẫn ở từng mục. Không cần chạy thêm gì.

Vì sao cần: RLS (Row Level Security) chỉ đảm bảo mỗi tài khoản **không xem
được** dữ liệu của tài khoản khác, nhưng khóa ngoại (foreign key) mặc định
chỉ kiểm tra "ID này có tồn tại không" chứ không kiểm tra "ID đó có thuộc
cùng tài khoản không". Ví dụ: nếu không có các trigger này, một request gửi
thẳng tới Supabase (không qua giao diện) vẫn có thể gắn `project_id` của tài
khoản A vào một tài liệu của tài khoản B, nếu biết được UUID đó.

Các cột được kiểm tra ở từng bảng:

- `documents`: `project_id`, `chapter_id` phải cùng tài khoản với tài liệu.
- `ai_avatars`: `project_id` phải cùng tài khoản với Avatar.
- `videos`: `project_id`, `chapter_id` phải cùng tài khoản với video (điều
  kiện `chapter_id` được bổ sung khi chạy migration Chương, vì lúc tạo bảng
  Video thì cột `videos.chapter_id` chưa tồn tại).
- `tasks`: `project_id`, `video_id` phải cùng tài khoản với tác vụ.
- `chapters`: `project_id` và `selected_avatar_id` phải cùng tài khoản với
  Chương.
- `scripts`: `project_id`, `chapter_id` phải cùng tài khoản với kịch bản.

Vì toàn bộ ứng dụng luôn lấy `project_id`/`chapter_id`/`selected_avatar_id`
từ dữ liệu đã tải riêng cho tài khoản đang đăng nhập, các thao tác bình
thường trong giao diện sẽ không bị ảnh hưởng gì — lớp kiểm tra này chỉ chặn
các trường hợp bất thường hoặc request thủ công sai lệch.
