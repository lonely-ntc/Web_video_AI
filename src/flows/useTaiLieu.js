import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import { layUrlTaiXuongTaiLieu } from '../database/fileTaiLieu';
import {
  diChuyenTaiLieu,
  doiTenTaiLieu,
  layDanhSachTaiLieu,
  taoTaiLieuNguoiDung,
  xoaTaiLieu,
} from '../database/taiLieu';
import useRealtimeLamMoi from './useRealtimeLamMoi';

function dichLoiTaiLieu(error, t, fallbackKey) {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return t('documentsPage.errors.tableUnavailable');
  }
  if (error?.code === '42501') {
    return t('documentsPage.errors.permissionDenied');
  }
  if (
    error?.code === 'StorageApiError'
    || /bucket.*not found/i.test(error?.message || '')
  ) {
    return t('documentsPage.errors.bucketUnavailable');
  }
  if (error?.code === 'INVALID_DOCUMENT_TYPE') {
    return t('documentsPage.errors.invalidType');
  }
  if (error?.code === 'DOCUMENT_TOO_LARGE') {
    return t('documentsPage.errors.tooLarge');
  }
  return error?.message || t(fallbackKey);
}

function useTaiLieu(user) {
  const { t } = useNgonNgu();
  const [danhSachTaiLieu, setDanhSachTaiLieu] = useState([]);
  const [dangTaiTaiLieu, setDangTaiTaiLieu] = useState(Boolean(user?.id));
  const [loiTaiTaiLieu, setLoiTaiTaiLieu] = useState('');
  const [dangTaiLenMap, setDangTaiLenMap] = useState({});
  const [loiTaiLenTaiLieu, setLoiTaiLenTaiLieu] = useState('');
  const userId = user?.id;

  const taiDanhSachTaiLieu = useCallback(async () => {
    setLoiTaiTaiLieu('');
    if (!userId) {
      setDanhSachTaiLieu([]);
      setDangTaiTaiLieu(false);
      return { data: [], error: null };
    }

    setDangTaiTaiLieu(true);
    const { data, error } = await layDanhSachTaiLieu(userId);
    if (error) {
      setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.loadFailed'));
      setDangTaiTaiLieu(false);
      return { data: null, error };
    }

    setDanhSachTaiLieu(data || []);
    setDangTaiTaiLieu(false);
    return { data: data || [], error: null };
  }, [t, userId]);

  useEffect(() => {
    let conHoatDong = true;

    const taiTaiLieu = async () => {
      if (!userId) {
        setDanhSachTaiLieu([]);
        setDangTaiTaiLieu(false);
        setLoiTaiTaiLieu('');
        return;
      }

      setDangTaiTaiLieu(true);
      setLoiTaiTaiLieu('');
      const { data, error } = await layDanhSachTaiLieu(userId);
      if (!conHoatDong) return;

      if (error) {
        setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.loadFailed'));
      } else {
        setDanhSachTaiLieu(data || []);
      }
      setDangTaiTaiLieu(false);
    };

    taiTaiLieu();
    return () => {
      conHoatDong = false;
    };
  }, [t, userId]);

  const taiLenTaiLieu = useCallback(async (file, projectId = null) => {
    setLoiTaiLenTaiLieu('');
    if (!user?.id) {
      const error = { code: 'LOGIN_REQUIRED' };
      setLoiTaiLenTaiLieu(t('documentsPage.errors.loginRequired'));
      return { data: null, error };
    }

    const chiaKhoa = `${file.name}-${Date.now()}`;
    setDangTaiLenMap((hienTai) => ({ ...hienTai, [chiaKhoa]: { ten: file.name, phanTram: 12 } }));

    const timerId = setInterval(() => {
      setDangTaiLenMap((hienTai) => {
        const muc = hienTai[chiaKhoa];
        if (!muc || muc.phanTram >= 90) return hienTai;
        return { ...hienTai, [chiaKhoa]: { ...muc, phanTram: Math.min(90, muc.phanTram + 15) } };
      });
    }, 260);

    const { data, error } = await taoTaiLieuNguoiDung(user, file, projectId);
    clearInterval(timerId);

    if (error) {
      setDangTaiLenMap((hienTai) => {
        const banSao = { ...hienTai };
        delete banSao[chiaKhoa];
        return banSao;
      });
      setLoiTaiLenTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.uploadFailed'));
      return { data: null, error };
    }

    setDangTaiLenMap((hienTai) => ({ ...hienTai, [chiaKhoa]: { ten: file.name, phanTram: 100 } }));
    setTimeout(() => {
      setDangTaiLenMap((hienTai) => {
        const banSao = { ...hienTai };
        delete banSao[chiaKhoa];
        return banSao;
      });
    }, 650);

    setDanhSachTaiLieu((hienTai) => [data, ...hienTai.filter((taiLieu) => taiLieu.id !== data.id)]);
    return { data, error: null };
  }, [t, user]);

  useRealtimeLamMoi(
    'documents',
    userId ? `user_id=eq.${userId}` : null,
    taiDanhSachTaiLieu,
  );

  const doiTen = useCallback(async (documentId, tenMoi) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await doiTenTaiLieu(userId, documentId, tenMoi);
    if (error) {
      setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.renameFailed'));
      return { data: null, error };
    }
    setDanhSachTaiLieu((hienTai) => hienTai.map((taiLieu) => (
      taiLieu.id === documentId ? data : taiLieu
    )));
    return { data, error: null };
  }, [t, userId]);

  const diChuyen = useCallback(async (documentId, projectId, projectName) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await diChuyenTaiLieu(userId, documentId, projectId);
    if (error) {
      setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.moveFailed'));
      return { data: null, error };
    }
    setDanhSachTaiLieu((hienTai) => hienTai.map((taiLieu) => (
      taiLieu.id === documentId ? { ...data, projectName } : taiLieu
    )));
    return { data, error: null };
  }, [t, userId]);

  const taiXuong = useCallback(async (documentId) => {
    const taiLieu = danhSachTaiLieu.find((item) => item.id === documentId);
    if (!taiLieu?.filePath) {
      const error = { code: 'FILE_NOT_FOUND' };
      setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.downloadFailed'));
      return { data: null, error };
    }

    const { data, error } = await layUrlTaiXuongTaiLieu(taiLieu.filePath, taiLieu.name);
    if (error || !data?.url) {
      setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.downloadFailed'));
      return { data: null, error: error || { code: 'DOWNLOAD_URL_FAILED' } };
    }
    return { data, error: null };
  }, [danhSachTaiLieu, t]);

  const xoa = useCallback(async (documentId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const taiLieu = danhSachTaiLieu.find((item) => item.id === documentId);
    const { error } = await xoaTaiLieu(userId, documentId, taiLieu?.filePath);
    if (error) {
      setLoiTaiTaiLieu(dichLoiTaiLieu(error, t, 'documentsPage.errors.deleteFailed'));
      return { error };
    }
    setDanhSachTaiLieu((hienTai) => hienTai.filter((item) => item.id !== documentId));
    return { error: null };
  }, [danhSachTaiLieu, t, userId]);

  return {
    danhSachTaiLieu,
    dangTaiTaiLieu,
    loiTaiTaiLieu,
    dangTaiLenMap,
    loiTaiLenTaiLieu,
    taiDanhSachTaiLieu,
    taiLenTaiLieu,
    doiTen,
    diChuyen,
    taiXuong,
    xoa,
    xoaLoiTaiLen: () => setLoiTaiLenTaiLieu(''),
  };
}

export default useTaiLieu;
