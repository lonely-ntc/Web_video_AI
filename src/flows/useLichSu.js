import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  chayLaiTacVu,
  huyTacVu,
  layDanhSachLichSu,
  xoaTacVu,
} from '../database/lichSu';
import useRealtimeLamMoi from './useRealtimeLamMoi';

function dichLoiLichSu(error, t, fallbackKey) {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return t('historyPage.errors.tableUnavailable');
  }
  if (error?.code === '42501') {
    return t('historyPage.errors.permissionDenied');
  }
  return error?.message || t(fallbackKey);
}

function useLichSu(user) {
  const { t } = useNgonNgu();
  const [danhSachTacVu, setDanhSachTacVu] = useState([]);
  const [dangTaiLichSu, setDangTaiLichSu] = useState(Boolean(user?.id));
  const [loiTaiLichSu, setLoiTaiLichSu] = useState('');
  const userId = user?.id;

  const taiDanhSachLichSu = useCallback(async () => {
    setLoiTaiLichSu('');
    if (!userId) {
      setDanhSachTacVu([]);
      setDangTaiLichSu(false);
      return { data: [], error: null };
    }

    setDangTaiLichSu(true);
    const { data, error } = await layDanhSachLichSu(userId);
    if (error) {
      setLoiTaiLichSu(dichLoiLichSu(error, t, 'historyPage.errors.loadFailed'));
      setDangTaiLichSu(false);
      return { data: null, error };
    }

    setDanhSachTacVu(data || []);
    setDangTaiLichSu(false);
    return { data: data || [], error: null };
  }, [t, userId]);

  useEffect(() => {
    let conHoatDong = true;

    const taiLichSu = async () => {
      if (!userId) {
        setDanhSachTacVu([]);
        setDangTaiLichSu(false);
        setLoiTaiLichSu('');
        return;
      }

      setDangTaiLichSu(true);
      setLoiTaiLichSu('');
      const { data, error } = await layDanhSachLichSu(userId);
      if (!conHoatDong) return;

      if (error) {
        setLoiTaiLichSu(dichLoiLichSu(error, t, 'historyPage.errors.loadFailed'));
      } else {
        setDanhSachTacVu(data || []);
      }
      setDangTaiLichSu(false);
    };

    taiLichSu();
    return () => {
      conHoatDong = false;
    };
  }, [t, userId]);

  useRealtimeLamMoi(
    'tasks',
    userId ? `user_id=eq.${userId}` : null,
    taiDanhSachLichSu,
  );
  useRealtimeLamMoi('task_steps', userId ? true : null, taiDanhSachLichSu);

  const huy = useCallback(async (taskId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await huyTacVu(userId, taskId);
    if (error) {
      setLoiTaiLichSu(dichLoiLichSu(error, t, 'historyPage.errors.cancelFailed'));
      return { data: null, error };
    }
    setDanhSachTacVu((hienTai) => hienTai.map((tacVu) => (tacVu.id === taskId ? data : tacVu)));
    return { data, error: null };
  }, [t, userId]);

  const chayLai = useCallback(async (taskId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await chayLaiTacVu(userId, taskId);
    if (error) {
      setLoiTaiLichSu(dichLoiLichSu(error, t, 'historyPage.errors.retryFailed'));
      return { data: null, error };
    }
    setDanhSachTacVu((hienTai) => hienTai.map((tacVu) => (tacVu.id === taskId ? data : tacVu)));
    return { data, error: null };
  }, [t, userId]);

  const xoa = useCallback(async (taskId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const { error } = await xoaTacVu(userId, taskId);
    if (error) {
      setLoiTaiLichSu(dichLoiLichSu(error, t, 'historyPage.errors.deleteFailed'));
      return { error };
    }
    setDanhSachTacVu((hienTai) => hienTai.filter((tacVu) => tacVu.id !== taskId));
    return { error: null };
  }, [t, userId]);

  return {
    danhSachTacVu,
    dangTaiLichSu,
    loiTaiLichSu,
    taiDanhSachLichSu,
    huy,
    chayLai,
    xoa,
  };
}

export default useLichSu;
