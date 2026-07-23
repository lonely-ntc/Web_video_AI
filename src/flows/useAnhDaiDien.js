import { useEffect, useState } from 'react';
import { taiAnhDaiDien } from '../database/anhDaiDien';
import { capNhatAnhDaiDien } from '../database/hoSoNguoiDung';
import { supabase } from '../database/supabase';

const LOAI_ANH_CHO_PHEP = ['image/jpeg', 'image/png', 'image/webp'];
const KICH_THUOC_TOI_DA = 5 * 1024 * 1024;

function dichLoiAnhDaiDien(error) {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('bucket not found') || error?.statusCode === '404') {
    return 'Chưa có kho ảnh avatars. Hãy chạy lại file SQL cấu hình Supabase.';
  }
  if (message.includes('row-level security') || error?.statusCode === '403') {
    return 'Tài khoản chưa có quyền cập nhật ảnh đại diện. Hãy kiểm tra chính sách Storage.';
  }
  return error?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.';
}

function useAnhDaiDien(user) {
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [thongBaoAnh, setThongBaoAnh] = useState('');
  const [loiAnh, setLoiAnh] = useState('');

  useEffect(() => {
    setAvatarUrl(user?.user_metadata?.avatar_url || '');
  }, [user?.id, user?.user_metadata?.avatar_url]);

  const capNhatAnh = async (file) => {
    setThongBaoAnh('');
    setLoiAnh('');

    if (!user?.id) {
      setLoiAnh('Bạn cần đăng nhập để thay đổi ảnh đại diện.');
      return;
    }
    if (!LOAI_ANH_CHO_PHEP.includes(file?.type)) {
      setLoiAnh('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > KICH_THUOC_TOI_DA) {
      setLoiAnh('Ảnh đại diện không được lớn hơn 5 MB.');
      return;
    }

    setDangTaiAnh(true);

    try {
      const { data: anhDaTai, error: uploadError } = await taiAnhDaiDien(user.id, file);
      if (uploadError) throw uploadError;

      const { error: profileError } = await capNhatAnhDaiDien(user, anhDaTai);
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: anhDaTai.url,
          avatar_path: anhDaTai.path,
        },
      });
      if (metadataError) throw metadataError;

      setAvatarUrl(anhDaTai.url);
      setThongBaoAnh('Ảnh đại diện đã được cập nhật thành công.');
    } catch (updateError) {
      setLoiAnh(dichLoiAnhDaiDien(updateError));
    } finally {
      setDangTaiAnh(false);
    }
  };

  return {
    avatarUrl,
    capNhatAnh,
    dangTaiAnh,
    loiAnh,
    thongBaoAnh,
  };
}

export default useAnhDaiDien;
