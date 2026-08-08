import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  capNhatChuong,
  capNhatKichBanChuong,
  chonAvatarChuong,
  chonVoiceChuong,
  layDanhSachChuong,
  taoChuongMoi,
  xoaChuong,
} from '../database/chuong';

function dichLoiChuong(error, t, fallbackKey) {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return t('chapterPage.errors.tableUnavailable');
  }
  if (error?.code === '42501') {
    return t('chapterPage.errors.permissionDenied');
  }
  return error?.message || t(fallbackKey);
}

function useChuong(user, projectId) {
  const { t } = useNgonNgu();
  const [danhSachChuong, setDanhSachChuong] = useState([]);
  const [dangTaiChuong, setDangTaiChuong] = useState(Boolean(user?.id && projectId));
  const [loiTaiChuong, setLoiTaiChuong] = useState('');
  const [dangLuuChuong, setDangLuuChuong] = useState(false);
  const [loiLuuChuong, setLoiLuuChuong] = useState('');
  const userId = user?.id;

  const taiDanhSachChuong = useCallback(async () => {
    setLoiTaiChuong('');
    if (!userId || !projectId) {
      setDanhSachChuong([]);
      setDangTaiChuong(false);
      return { data: [], error: null };
    }

    setDangTaiChuong(true);
    const { data, error } = await layDanhSachChuong(userId, projectId);
    if (error) {
      setLoiTaiChuong(dichLoiChuong(error, t, 'chapterPage.errors.loadFailed'));
      setDangTaiChuong(false);
      return { data: null, error };
    }

    setDanhSachChuong(data || []);
    setDangTaiChuong(false);
    return { data: data || [], error: null };
  }, [projectId, t, userId]);

  useEffect(() => {
    let conHoatDong = true;

    const taiChuong = async () => {
      if (!userId || !projectId) {
        setDanhSachChuong([]);
        setDangTaiChuong(false);
        setLoiTaiChuong('');
        return;
      }

      setDangTaiChuong(true);
      setLoiTaiChuong('');
      const { data, error } = await layDanhSachChuong(userId, projectId);
      if (!conHoatDong) return;

      if (error) {
        setLoiTaiChuong(dichLoiChuong(error, t, 'chapterPage.errors.loadFailed'));
      } else {
        setDanhSachChuong(data || []);
      }
      setDangTaiChuong(false);
    };

    taiChuong();
    return () => {
      conHoatDong = false;
    };
  }, [projectId, t, userId]);

  const luuChuongMoi = useCallback(async (duLieu) => {
    setLoiLuuChuong('');
    if (!user?.id || !projectId) {
      const error = { code: 'LOGIN_REQUIRED' };
      setLoiLuuChuong(t('chapterPage.errors.loginRequired'));
      return { data: null, error };
    }

    setDangLuuChuong(true);
    const viTri = danhSachChuong.length;
    const { data, error } = await taoChuongMoi(user, projectId, duLieu, viTri);
    setDangLuuChuong(false);

    if (error) {
      setLoiLuuChuong(dichLoiChuong(error, t, 'chapterPage.errors.saveFailed'));
      return { data: null, error };
    }

    setDanhSachChuong((hienTai) => [...hienTai, data]);
    return { data, error: null };
  }, [danhSachChuong.length, projectId, t, user]);

  const suaChuong = useCallback(async (chuongId, duLieu) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await capNhatChuong(userId, chuongId, duLieu);
    if (error) {
      return { data: null, error: { ...error, message: dichLoiChuong(error, t, 'chapterPage.errors.saveFailed') } };
    }
    setDanhSachChuong((hienTai) => hienTai.map((chuong) => (chuong.id === chuongId ? data : chuong)));
    return { data, error: null };
  }, [t, userId]);

  const xoa = useCallback(async (chuongId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const { error } = await xoaChuong(userId, chuongId);
    if (error) return { error };
    setDanhSachChuong((hienTai) => hienTai.filter((chuong) => chuong.id !== chuongId));
    return { error: null };
  }, [userId]);

  const luuKichBan = useCallback(async (chuongId, kichBan) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await capNhatKichBanChuong(userId, chuongId, kichBan);
    if (error) {
      return { data: null, error: { ...error, message: dichLoiChuong(error, t, 'chapterPage.errors.saveFailed') } };
    }
    setDanhSachChuong((hienTai) => hienTai.map((chuong) => (chuong.id === chuongId ? data : chuong)));
    return { data, error: null };
  }, [t, userId]);

  const chonAvatar = useCallback(async (chuongId, avatarId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await chonAvatarChuong(userId, chuongId, avatarId);
    if (error) return { data: null, error };
    setDanhSachChuong((hienTai) => hienTai.map((chuong) => (chuong.id === chuongId ? data : chuong)));
    return { data, error: null };
  }, [userId]);

  const chonVoice = useCallback(async (chuongId, voiceId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await chonVoiceChuong(userId, chuongId, voiceId);
    if (error) return { data: null, error };
    setDanhSachChuong((hienTai) => hienTai.map((chuong) => (chuong.id === chuongId ? data : chuong)));
    return { data, error: null };
  }, [userId]);

  return {
    danhSachChuong,
    dangTaiChuong,
    loiTaiChuong,
    dangLuuChuong,
    loiLuuChuong,
    taiDanhSachChuong,
    luuChuongMoi,
    suaChuong,
    xoaChuong: xoa,
    luuKichBan,
    chonAvatar,
    chonVoice,
    xoaLoiLuuChuong: () => setLoiLuuChuong(''),
  };
}

export default useChuong;
