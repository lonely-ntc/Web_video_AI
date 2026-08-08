import { useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import { taiAnhDaiDien } from '../database/anhDaiDien';
import { capNhatAnhDaiDien } from '../database/hoSoNguoiDung';
import { supabase } from '../database/supabase';

const LOAI_ANH_CHO_PHEP = ['image/jpeg', 'image/png', 'image/webp'];
const KICH_THUOC_TOI_DA = 5 * 1024 * 1024;

function dichLoiAnhDaiDien(error, t) {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('bucket not found') || error?.statusCode === '404') {
    return t('profile.avatar.bucketMissing');
  }
  if (message.includes('row-level security') || error?.statusCode === '403') {
    return t('profile.avatar.permissionDenied');
  }
  return error?.message || t('profile.avatar.updateFailed');
}

function useAnhDaiDien(user) {
  const { t } = useNgonNgu();
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
      setLoiAnh(t('profile.avatar.loginRequired'));
      return;
    }
    if (!LOAI_ANH_CHO_PHEP.includes(file?.type)) {
      setLoiAnh(t('profile.avatar.invalidType'));
      return;
    }
    if (file.size > KICH_THUOC_TOI_DA) {
      setLoiAnh(t('profile.avatar.tooLarge'));
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
      setThongBaoAnh(t('profile.avatar.updated'));
    } catch (updateError) {
      setLoiAnh(dichLoiAnhDaiDien(updateError, t));
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
