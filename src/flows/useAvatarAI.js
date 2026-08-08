import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  datAvatarMacDinh,
  diChuyenAvatarAI,
  doiTenAvatarAI,
  layDanhSachAvatarAI,
  taoAvatarAINguoiDung,
  xoaAvatarAI,
} from '../database/avatarAI';
import { layUrlTaiXuongAvatarAI } from '../database/fileAvatarAI';

function dichLoiAvatar(error, t, fallbackKey) {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return t('avatarPage.errors.tableUnavailable');
  }
  if (error?.code === '42501') {
    return t('avatarPage.errors.permissionDenied');
  }
  if (
    error?.code === 'StorageApiError'
    || /bucket.*not found/i.test(error?.message || '')
  ) {
    return t('avatarPage.errors.bucketUnavailable');
  }
  if (error?.code === 'INVALID_AVATAR_TYPE') {
    return t('avatarPage.errors.invalidType');
  }
  if (error?.code === 'AVATAR_TOO_LARGE') {
    return t('avatarPage.errors.tooLarge');
  }
  return error?.message || t(fallbackKey);
}

function useAvatarAI(user) {
  const { t } = useNgonNgu();
  const [danhSachAvatar, setDanhSachAvatar] = useState([]);
  const [dangTaiAvatar, setDangTaiAvatar] = useState(Boolean(user?.id));
  const [loiTaiAvatar, setLoiTaiAvatar] = useState('');
  const [dangTaiLenMap, setDangTaiLenMap] = useState({});
  const [loiTaiLenAvatar, setLoiTaiLenAvatar] = useState('');
  const userId = user?.id;

  const taiDanhSachAvatar = useCallback(async () => {
    setLoiTaiAvatar('');
    if (!userId) {
      setDanhSachAvatar([]);
      setDangTaiAvatar(false);
      return { data: [], error: null };
    }

    setDangTaiAvatar(true);
    const { data, error } = await layDanhSachAvatarAI(userId);
    if (error) {
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.loadFailed'));
      setDangTaiAvatar(false);
      return { data: null, error };
    }

    setDanhSachAvatar(data || []);
    setDangTaiAvatar(false);
    return { data: data || [], error: null };
  }, [t, userId]);

  useEffect(() => {
    let conHoatDong = true;

    const taiAvatar = async () => {
      if (!userId) {
        setDanhSachAvatar([]);
        setDangTaiAvatar(false);
        setLoiTaiAvatar('');
        return;
      }

      setDangTaiAvatar(true);
      setLoiTaiAvatar('');
      const { data, error } = await layDanhSachAvatarAI(userId);
      if (!conHoatDong) return;

      if (error) {
        setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.loadFailed'));
      } else {
        setDanhSachAvatar(data || []);
      }
      setDangTaiAvatar(false);
    };

    taiAvatar();
    return () => {
      conHoatDong = false;
    };
  }, [t, userId]);

  const taiLenAvatar = useCallback(async (file, projectId = null) => {
    setLoiTaiLenAvatar('');
    if (!user?.id) {
      const error = { code: 'LOGIN_REQUIRED' };
      setLoiTaiLenAvatar(t('avatarPage.errors.loginRequired'));
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

    const { data, error } = await taoAvatarAINguoiDung(user, file, projectId);
    clearInterval(timerId);

    if (error) {
      setDangTaiLenMap((hienTai) => {
        const banSao = { ...hienTai };
        delete banSao[chiaKhoa];
        return banSao;
      });
      setLoiTaiLenAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.uploadFailed'));
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

    setDanhSachAvatar((hienTai) => [data, ...hienTai.filter((avatar) => avatar.id !== data.id)]);
    return { data, error: null };
  }, [t, user]);

  const doiTen = useCallback(async (avatarId, tenMoi) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await doiTenAvatarAI(userId, avatarId, tenMoi);
    if (error) {
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.renameFailed'));
      return { data: null, error };
    }
    setDanhSachAvatar((hienTai) => hienTai.map((avatar) => (avatar.id === avatarId ? data : avatar)));
    return { data, error: null };
  }, [t, userId]);

  const datMacDinh = useCallback(async (avatarId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await datAvatarMacDinh(userId, avatarId);
    if (error) {
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.setDefaultFailed'));
      return { data: null, error };
    }
    setDanhSachAvatar((hienTai) => hienTai.map((avatar) => ({
      ...avatar,
      isDefault: avatar.id === avatarId,
    })));
    return { data, error: null };
  }, [t, userId]);

  const diChuyen = useCallback(async (avatarId, projectId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await diChuyenAvatarAI(userId, avatarId, projectId);
    if (error) {
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.moveFailed'));
      return { data: null, error };
    }
    setDanhSachAvatar((hienTai) => hienTai.map((avatar) => (avatar.id === avatarId ? data : avatar)));
    return { data, error: null };
  }, [t, userId]);

  const taiXuong = useCallback(async (avatarId) => {
    const avatar = danhSachAvatar.find((item) => item.id === avatarId);
    if (!avatar?.filePath) {
      const error = { code: 'FILE_NOT_FOUND' };
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.downloadFailed'));
      return { data: null, error };
    }

    const { data, error } = await layUrlTaiXuongAvatarAI(avatar.filePath, `${avatar.name}.${avatar.format.toLowerCase()}`);
    if (error || !data?.url) {
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.downloadFailed'));
      return { data: null, error: error || { code: 'DOWNLOAD_URL_FAILED' } };
    }
    return { data, error: null };
  }, [danhSachAvatar, t]);

  const xoa = useCallback(async (avatarId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const avatar = danhSachAvatar.find((item) => item.id === avatarId);
    const { error } = await xoaAvatarAI(userId, avatarId, avatar?.filePath);
    if (error) {
      setLoiTaiAvatar(dichLoiAvatar(error, t, 'avatarPage.errors.deleteFailed'));
      return { error };
    }
    setDanhSachAvatar((hienTai) => hienTai.filter((item) => item.id !== avatarId));
    return { error: null };
  }, [danhSachAvatar, t, userId]);

  return {
    danhSachAvatar,
    dangTaiAvatar,
    loiTaiAvatar,
    dangTaiLenMap,
    loiTaiLenAvatar,
    taiDanhSachAvatar,
    taiLenAvatar,
    doiTen,
    datMacDinh,
    diChuyen,
    taiXuong,
    xoa,
    xoaLoiTaiLen: () => setLoiTaiLenAvatar(''),
  };
}

export default useAvatarAI;
