import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  capNhatDuAn,
  doiTrangThaiDuAn,
  layDanhSachDuAn,
  taoDuAnNguoiDung,
  xoaDuAnNguoiDung,
} from '../database/duAn';

function dichLoiDuAn(error, t, fallbackKey) {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return t('projectsPage.errors.tableUnavailable');
  }
  if (error?.code === '42501') {
    return t('projectsPage.errors.permissionDenied');
  }
  if (
    error?.code === 'StorageApiError'
    || /bucket.*not found/i.test(error?.message || '')
  ) {
    return t('projectsPage.errors.bucketUnavailable');
  }
  if (error?.code === 'INVALID_PROJECT_COVER_TYPE') {
    return t('projectsPage.errors.invalidCover');
  }
  if (error?.code === 'PROJECT_COVER_TOO_LARGE') {
    return t('projectsPage.errors.coverTooLarge');
  }
  return error?.message || t(fallbackKey);
}

function useDuAn(user) {
  const { t } = useNgonNgu();
  const [danhSachDuAn, setDanhSachDuAn] = useState([]);
  const [dangTaiDuAn, setDangTaiDuAn] = useState(Boolean(user?.id));
  const [dangLuuDuAn, setDangLuuDuAn] = useState(false);
  const [loiTaiDuAn, setLoiTaiDuAn] = useState('');
  const [loiLuuDuAn, setLoiLuuDuAn] = useState('');
  const userId = user?.id;

  const taiDanhSachDuAn = useCallback(async () => {
    setLoiTaiDuAn('');
    if (!userId) {
      setDanhSachDuAn([]);
      setDangTaiDuAn(false);
      return { data: [], error: null };
    }

    setDangTaiDuAn(true);
    const { data, error } = await layDanhSachDuAn(userId);
    if (error) {
      setLoiTaiDuAn(dichLoiDuAn(error, t, 'projectsPage.errors.loadFailed'));
      setDangTaiDuAn(false);
      return { data: null, error };
    }

    setDanhSachDuAn(data || []);
    setDangTaiDuAn(false);
    return { data: data || [], error: null };
  }, [t, userId]);

  useEffect(() => {
    let conHoatDong = true;

    const taiDuAn = async () => {
      if (!userId) {
        setDanhSachDuAn([]);
        setDangTaiDuAn(false);
        setLoiTaiDuAn('');
        return;
      }

      setDangTaiDuAn(true);
      setLoiTaiDuAn('');
      const { data, error } = await layDanhSachDuAn(userId);
      if (!conHoatDong) return;

      if (error) {
        setLoiTaiDuAn(dichLoiDuAn(error, t, 'projectsPage.errors.loadFailed'));
      } else {
        setDanhSachDuAn(data || []);
      }
      setDangTaiDuAn(false);
    };

    taiDuAn();
    return () => {
      conHoatDong = false;
    };
  }, [t, userId]);

  const luuDuAn = async (duLieu) => {
    setLoiLuuDuAn('');
    if (!user?.id) {
      const error = { code: 'LOGIN_REQUIRED' };
      setLoiLuuDuAn(t('projectsPage.errors.loginRequired'));
      return { data: null, error };
    }

    setDangLuuDuAn(true);
    const { data, error } = await taoDuAnNguoiDung(user, duLieu);
    setDangLuuDuAn(false);

    if (error) {
      setLoiLuuDuAn(dichLoiDuAn(error, t, 'projectsPage.errors.saveFailed'));
      return { data: null, error };
    }

    setDanhSachDuAn((hienTai) => [
      data,
      ...hienTai.filter((duAn) => duAn.id !== data.id),
    ]);
    return { data, error: null };
  };

  const capNhatProject = useCallback(async (projectId, duLieu) => {
    if (!user?.id) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await capNhatDuAn(user.id, projectId, duLieu);
    if (error) {
      return { data: null, error: { ...error, message: dichLoiDuAn(error, t, 'projectsPage.errors.saveFailed') } };
    }
    setDanhSachDuAn((hienTai) => hienTai.map((duAn) => (duAn.id === projectId ? data : duAn)));
    return { data, error: null };
  }, [t, user]);

  const luuTruProject = useCallback(async (projectId) => {
    if (!user?.id) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await doiTrangThaiDuAn(user.id, projectId, 'archived');
    if (error) return { data: null, error };
    setDanhSachDuAn((hienTai) => hienTai.map((duAn) => (duAn.id === projectId ? data : duAn)));
    return { data, error: null };
  }, [user]);

  const xoaProject = useCallback(async (projectId) => {
    if (!user?.id) return { error: { code: 'LOGIN_REQUIRED' } };
    const duAn = danhSachDuAn.find((item) => item.id === projectId);
    const { error } = await xoaDuAnNguoiDung(user.id, projectId, duAn?.coverPath);
    if (error) return { error };
    setDanhSachDuAn((hienTai) => hienTai.filter((item) => item.id !== projectId));
    return { error: null };
  }, [danhSachDuAn, user]);

  return {
    danhSachDuAn,
    dangTaiDuAn,
    dangLuuDuAn,
    loiTaiDuAn,
    loiLuuDuAn,
    taiDanhSachDuAn,
    luuDuAn,
    capNhatProject,
    luuTruProject,
    xoaProject,
    xoaLoiLuuDuAn: () => setLoiLuuDuAn(''),
  };
}

export default useDuAn;
