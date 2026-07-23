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
