import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  diChuyenVideo,
  doiTenVideo,
  layDanhSachVideo,
  taoVideoNguoiDung,
  xoaVideo,
} from '../database/video';
import { layUrlTaiXuongVideo } from '../database/fileVideo';
import useRealtimeLamMoi from './useRealtimeLamMoi';

function dichLoiVideo(error, t, fallbackKey) {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return t('videoPage.errors.tableUnavailable');
  }
  if (error?.code === '42501') {
    return t('videoPage.errors.permissionDenied');
  }
  if (
    error?.code === 'StorageApiError'
    || /bucket.*not found/i.test(error?.message || '')
  ) {
    return t('videoPage.errors.bucketUnavailable');
  }
  if (error?.code === 'INVALID_VIDEO_TYPE') {
    return t('videoPage.errors.invalidType');
  }
  if (error?.code === 'VIDEO_TOO_LARGE') {
    return t('videoPage.errors.tooLarge');
  }
  return error?.message || t(fallbackKey);
}

function useVideo(user) {
  const { t } = useNgonNgu();
  const [danhSachVideo, setDanhSachVideo] = useState([]);
  const [dangTaiVideo, setDangTaiVideo] = useState(Boolean(user?.id));
  const [loiTaiVideo, setLoiTaiVideo] = useState('');
  const [dangTaiLenMap, setDangTaiLenMap] = useState({});
  const [loiTaiLenVideo, setLoiTaiLenVideo] = useState('');
  const userId = user?.id;

  const taiDanhSachVideo = useCallback(async () => {
    setLoiTaiVideo('');
    if (!userId) {
      setDanhSachVideo([]);
      setDangTaiVideo(false);
      return { data: [], error: null };
    }

    setDangTaiVideo(true);
    const { data, error } = await layDanhSachVideo(userId);
    if (error) {
      setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.loadFailed'));
      setDangTaiVideo(false);
      return { data: null, error };
    }

    setDanhSachVideo(data || []);
    setDangTaiVideo(false);
    return { data: data || [], error: null };
  }, [t, userId]);

  useEffect(() => {
    let conHoatDong = true;

    const taiVideo = async () => {
      if (!userId) {
        setDanhSachVideo([]);
        setDangTaiVideo(false);
        setLoiTaiVideo('');
        return;
      }

      setDangTaiVideo(true);
      setLoiTaiVideo('');
      const { data, error } = await layDanhSachVideo(userId);
      if (!conHoatDong) return;

      if (error) {
        setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.loadFailed'));
      } else {
        setDanhSachVideo(data || []);
      }
      setDangTaiVideo(false);
    };

    taiVideo();
    return () => {
      conHoatDong = false;
    };
  }, [t, userId]);

  useRealtimeLamMoi(
    'videos',
    userId ? `user_id=eq.${userId}` : null,
    taiDanhSachVideo,
  );

  const taiLenVideo = useCallback(async (file, projectId = null) => {
    setLoiTaiLenVideo('');
    if (!user?.id) {
      const error = { code: 'LOGIN_REQUIRED' };
      setLoiTaiLenVideo(t('videoPage.errors.loginRequired'));
      return { data: null, error };
    }

    const chiaKhoa = `${file.name}-${Date.now()}`;
    setDangTaiLenMap((hienTai) => ({ ...hienTai, [chiaKhoa]: { ten: file.name, phanTram: 8 } }));

    const timerId = setInterval(() => {
      setDangTaiLenMap((hienTai) => {
        const muc = hienTai[chiaKhoa];
        if (!muc || muc.phanTram >= 90) return hienTai;
        return { ...hienTai, [chiaKhoa]: { ...muc, phanTram: Math.min(90, muc.phanTram + 10) } };
      });
    }, 300);

    const { data, error } = await taoVideoNguoiDung(user, file, projectId);
    clearInterval(timerId);

    if (error) {
      setDangTaiLenMap((hienTai) => {
        const banSao = { ...hienTai };
        delete banSao[chiaKhoa];
        return banSao;
      });
      setLoiTaiLenVideo(dichLoiVideo(error, t, 'videoPage.errors.uploadFailed'));
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

    setDanhSachVideo((hienTai) => [data, ...hienTai.filter((video) => video.id !== data.id)]);
    return { data, error: null };
  }, [t, user]);

  const doiTen = useCallback(async (videoId, tenMoi) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await doiTenVideo(userId, videoId, tenMoi);
    if (error) {
      setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.renameFailed'));
      return { data: null, error };
    }
    setDanhSachVideo((hienTai) => hienTai.map((video) => (video.id === videoId ? data : video)));
    return { data, error: null };
  }, [t, userId]);

  const diChuyen = useCallback(async (videoId, projectId) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await diChuyenVideo(userId, videoId, projectId);
    if (error) {
      setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.moveFailed'));
      return { data: null, error };
    }
    setDanhSachVideo((hienTai) => hienTai.map((video) => (video.id === videoId ? data : video)));
    return { data, error: null };
  }, [t, userId]);

  const taiXuong = useCallback(async (videoId) => {
    const video = danhSachVideo.find((item) => item.id === videoId);
    if (!video?.filePath) {
      const error = { code: 'FILE_NOT_FOUND' };
      setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.downloadFailed'));
      return { data: null, error };
    }

    const { data, error } = await layUrlTaiXuongVideo(
      video.filePath,
      `${video.name}.${(video.format || 'mp4').toLowerCase()}`,
    );
    if (error || !data?.url) {
      setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.downloadFailed'));
      return { data: null, error: error || { code: 'DOWNLOAD_URL_FAILED' } };
    }
    return { data, error: null };
  }, [danhSachVideo, t]);

  const xoa = useCallback(async (videoId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const video = danhSachVideo.find((item) => item.id === videoId);
    const { error } = await xoaVideo(userId, videoId, video?.filePath);
    if (error) {
      setLoiTaiVideo(dichLoiVideo(error, t, 'videoPage.errors.deleteFailed'));
      return { error };
    }
    setDanhSachVideo((hienTai) => hienTai.filter((item) => item.id !== videoId));
    return { error: null };
  }, [danhSachVideo, t, userId]);

  return {
    danhSachVideo,
    dangTaiVideo,
    loiTaiVideo,
    dangTaiLenMap,
    loiTaiLenVideo,
    taiDanhSachVideo,
    taiLenVideo,
    doiTen,
    diChuyen,
    taiXuong,
    xoa,
    xoaLoiTaiLen: () => setLoiTaiLenVideo(''),
  };
}

export default useVideo;
