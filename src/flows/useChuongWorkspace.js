import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  doiTenTaiLieu,
  layDanhSachTaiLieuTheoChuong,
  taoTaiLieuNguoiDung,
  xoaTaiLieu,
} from '../database/taiLieu';
import {
  layDanhSachVideoTheoChuong,
  taoVideoNguoiDung,
  xoaVideo,
} from '../database/video';
import { layUrlTaiXuongVideo } from '../database/fileVideo';

function dichLoi(error, t) {
  if (['42P01', 'PGRST205'].includes(error?.code)) return t('chapterDetailPage.errors.tableUnavailable');
  if (error?.code === '42501') return t('chapterDetailPage.errors.permissionDenied');
  if (error?.code === 'INVALID_DOCUMENT_TYPE' || error?.code === 'INVALID_VIDEO_TYPE') {
    return t('chapterDetailPage.errors.invalidType');
  }
  if (error?.code === 'DOCUMENT_TOO_LARGE' || error?.code === 'VIDEO_TOO_LARGE') {
    return t('chapterDetailPage.errors.tooLarge');
  }
  return error?.message || t('chapterDetailPage.errors.actionFailed');
}

function useChuongWorkspace(user, projectId, chapterId) {
  const { t } = useNgonNgu();
  const userId = user?.id;

  const [danhSachTaiLieu, setDanhSachTaiLieu] = useState([]);
  const [dangTaiTaiLieu, setDangTaiTaiLieu] = useState(true);
  const [loiTaiLieu, setLoiTaiLieu] = useState('');
  const [dangUploadTaiLieu, setDangUploadTaiLieu] = useState(false);

  const [danhSachVideo, setDanhSachVideo] = useState([]);
  const [dangTaiVideo, setDangTaiVideo] = useState(true);
  const [loiVideo, setLoiVideo] = useState('');
  const [dangUploadVideo, setDangUploadVideo] = useState(false);

  const taiLaiTaiLieu = useCallback(async () => {
    if (!userId || !chapterId) { setDanhSachTaiLieu([]); setDangTaiTaiLieu(false); return; }
    setDangTaiTaiLieu(true);
    setLoiTaiLieu('');
    const { data, error } = await layDanhSachTaiLieuTheoChuong(userId, chapterId);
    if (error) setLoiTaiLieu(dichLoi(error, t));
    else setDanhSachTaiLieu(data || []);
    setDangTaiTaiLieu(false);
  }, [chapterId, t, userId]);

  const taiLaiVideo = useCallback(async () => {
    if (!userId || !chapterId) { setDanhSachVideo([]); setDangTaiVideo(false); return; }
    setDangTaiVideo(true);
    setLoiVideo('');
    const { data, error } = await layDanhSachVideoTheoChuong(userId, chapterId);
    if (error) setLoiVideo(dichLoi(error, t));
    else setDanhSachVideo(data || []);
    setDangTaiVideo(false);
  }, [chapterId, t, userId]);

  useEffect(() => { taiLaiTaiLieu(); }, [taiLaiTaiLieu]);
  useEffect(() => { taiLaiVideo(); }, [taiLaiVideo]);

  const uploadTaiLieu = useCallback(async (file) => {
    if (!user?.id) return { error: { code: 'LOGIN_REQUIRED' } };
    setDangUploadTaiLieu(true);
    const { data, error } = await taoTaiLieuNguoiDung(user, file, projectId, chapterId);
    setDangUploadTaiLieu(false);
    if (error) { setLoiTaiLieu(dichLoi(error, t)); return { error }; }
    setDanhSachTaiLieu((hienTai) => [data, ...hienTai]);
    return { data, error: null };
  }, [chapterId, projectId, t, user]);

  const xoaMotTaiLieu = useCallback(async (documentId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const taiLieu = danhSachTaiLieu.find((item) => item.id === documentId);
    const { error } = await xoaTaiLieu(userId, documentId, taiLieu?.filePath);
    if (error) { setLoiTaiLieu(dichLoi(error, t)); return { error }; }
    setDanhSachTaiLieu((hienTai) => hienTai.filter((item) => item.id !== documentId));
    return { error: null };
  }, [danhSachTaiLieu, t, userId]);

  const suaTenTaiLieu = useCallback(async (documentId, tenMoi) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await doiTenTaiLieu(userId, documentId, tenMoi);
    if (error) { setLoiTaiLieu(dichLoi(error, t)); return { data: null, error }; }
    setDanhSachTaiLieu((hienTai) => hienTai.map((item) => (item.id === documentId ? data : item)));
    return { data, error: null };
  }, [t, userId]);

  const uploadVideo = useCallback(async (file) => {
    if (!user?.id) return { error: { code: 'LOGIN_REQUIRED' } };
    setDangUploadVideo(true);
    const { data, error } = await taoVideoNguoiDung(user, file, projectId, chapterId);
    setDangUploadVideo(false);
    if (error) { setLoiVideo(dichLoi(error, t)); return { error }; }
    setDanhSachVideo((hienTai) => [data, ...hienTai]);
    return { data, error: null };
  }, [chapterId, projectId, t, user]);

  const xoaMotVideo = useCallback(async (videoId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const video = danhSachVideo.find((item) => item.id === videoId);
    const { error } = await xoaVideo(userId, videoId, video?.filePath);
    if (error) { setLoiVideo(dichLoi(error, t)); return { error }; }
    setDanhSachVideo((hienTai) => hienTai.filter((item) => item.id !== videoId));
    return { error: null };
  }, [danhSachVideo, t, userId]);

  const taiXuongVideo = useCallback(async (videoId) => {
    const video = danhSachVideo.find((item) => item.id === videoId);
    if (!video?.filePath) return { error: { code: 'FILE_NOT_FOUND' } };
    const { data, error } = await layUrlTaiXuongVideo(video.filePath, `${video.name}.${(video.format || 'mp4').toLowerCase()}`);
    if (error || !data?.url) return { error: error || { code: 'DOWNLOAD_URL_FAILED' } };
    return { data, error: null };
  }, [danhSachVideo]);

  return {
    danhSachTaiLieu,
    dangTaiTaiLieu,
    loiTaiLieu,
    dangUploadTaiLieu,
    uploadTaiLieu,
    xoaMotTaiLieu,
    suaTenTaiLieu,
    danhSachVideo,
    dangTaiVideo,
    loiVideo,
    dangUploadVideo,
    uploadVideo,
    xoaMotVideo,
    taiXuongVideo,
  };
}

export default useChuongWorkspace;
