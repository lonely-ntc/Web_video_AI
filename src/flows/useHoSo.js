import { useEffect, useRef, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import { supabase } from '../database/supabase';
import {
  layHoSoNguoiDung,
  luuHoSoNguoiDung,
} from '../database/hoSoNguoiDung';

function taoDuLieuHoSo(user, duLieuSupabase = null) {
  const metadata = user?.user_metadata || {};

  return {
    fullName: metadata.full_name ?? duLieuSupabase?.full_name ?? '',
    displayName:
      metadata.display_name
      ?? metadata.full_name
      ?? duLieuSupabase?.display_name
      ?? duLieuSupabase?.full_name
      ?? '',
    phone: metadata.phone ?? duLieuSupabase?.phone ?? '',
    company: metadata.company ?? duLieuSupabase?.company ?? '',
    jobTitle: metadata.job_title ?? duLieuSupabase?.job_title ?? '',
    bio: metadata.bio ?? duLieuSupabase?.bio ?? '',
  };
}

function laLoiBangHoSoChuaSanSang(error) {
  return ['42P01', 'PGRST205', '42501'].includes(error?.code);
}

function dichLoiHoSo(error, t) {
  if (laLoiBangHoSoChuaSanSang(error)) {
    return t('profile.errors.tableUnavailable');
  }
  return error?.message || t('profile.errors.loadFailed');
}

function useHoSo(user) {
  const { t } = useNgonNgu();
  const userBanDauRef = useRef(user);
  const [hoSo, setHoSo] = useState(() => taoDuLieuHoSo(user));
  const [dangTai, setDangTai] = useState(Boolean(user?.id));
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState('');
  const [loi, setLoi] = useState('');
  const userId = user?.id;

  useEffect(() => {
    let conHoatDong = true;

    const taiHoSo = async () => {
      setThongBao('');
      setLoi('');

      if (!userId) {
        setDangTai(false);
        return;
      }

      setDangTai(true);

      try {
        const { data, error } = await layHoSoNguoiDung(userId);
        if (error) throw error;
        if (conHoatDong && data) {
          setHoSo(taoDuLieuHoSo(userBanDauRef.current, data));
        }
      } catch (loadError) {
        if (conHoatDong) {
          setLoi(dichLoiHoSo(loadError, t));
        }
      } finally {
        if (conHoatDong) setDangTai(false);
      }
    };

    taiHoSo();

    return () => {
      conHoatDong = false;
    };
  }, [t, userId]);

  const capNhatTruong = (tenTruong) => (event) => {
    setHoSo((hienTai) => ({ ...hienTai, [tenTruong]: event.target.value }));
    setThongBao('');
    setLoi('');
  };

  const luuHoSo = async (event) => {
    event.preventDefault();
    setThongBao('');
    setLoi('');

    if (hoSo.fullName.trim().length < 2) {
      setLoi(t('profile.errors.fullNameTooShort'));
      return;
    }
    if (!user?.id) {
      setLoi(t('profile.errors.loginRequired'));
      return;
    }

    setDangLuu(true);

    try {
      const { error: profileError } = await luuHoSoNguoiDung(user, hoSo);
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...user?.user_metadata,
          full_name: hoSo.fullName.trim(),
          display_name: hoSo.displayName.trim(),
          phone: hoSo.phone.trim(),
          company: hoSo.company.trim(),
          job_title: hoSo.jobTitle.trim(),
          bio: hoSo.bio.trim(),
        },
      });

      if (metadataError) throw metadataError;

      setThongBao(t('profile.saved'));
    } catch (updateError) {
      setLoi(dichLoiHoSo(updateError, t));
    } finally {
      setDangLuu(false);
    }
  };

  return {
    hoSo,
    dangTai,
    dangLuu,
    thongBao,
    loi,
    capNhatTruong,
    luuHoSo,
  };
}

export default useHoSo;
