import { useCallback, useEffect, useState } from 'react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import {
  capNhatKichBan,
  layDanhSachKichBan,
  taoKichBanBangAI,
  taoKichBanMoi,
  xoaKichBan,
} from '../database/kichBan';
import { taoPptTuKichBan } from '../services/baiGiangPpt';
import useRealtimeLamMoi from './useRealtimeLamMoi';

function dichLoiKichBan(error, t) {
  if (['42P01', 'PGRST205'].includes(error?.code)) return t('scriptPage.errors.tableUnavailable');
  if (error?.code === '42501') return t('scriptPage.errors.permissionDenied');
  return error?.message || t('scriptPage.errors.actionFailed');
}

function useKichBan(user, projectId, chapterId) {
  const { t } = useNgonNgu();
  const userId = user?.id;

  const [danhSachKichBan, setDanhSachKichBan] = useState([]);
  const [dangTaiKichBan, setDangTaiKichBan] = useState(true);
  const [loiKichBan, setLoiKichBan] = useState('');
  const [dangTaoKichBan, setDangTaoKichBan] = useState(false);
  const [dangTaoBangAI, setDangTaoBangAI] = useState(false);
  const [dangTaoPpt, setDangTaoPpt] = useState(false);
  const [loiPpt, setLoiPpt] = useState('');

  const kichBanMoiNhat = danhSachKichBan[0] || null;

  const taiLaiDanhSach = useCallback(async () => {
    if (!userId || !chapterId) {
      setDanhSachKichBan([]);
      setDangTaiKichBan(false);
      return { data: [], error: null };
    }

    setDangTaiKichBan(true);
    setLoiKichBan('');
    const { data, error } = await layDanhSachKichBan(userId, chapterId);
    if (error) {
      setLoiKichBan(dichLoiKichBan(error, t));
      setDangTaiKichBan(false);
      return { data: null, error };
    }

    setDanhSachKichBan(data || []);
    setDangTaiKichBan(false);
    return { data: data || [], error: null };
  }, [chapterId, t, userId]);

  useEffect(() => { taiLaiDanhSach(); }, [taiLaiDanhSach]);

  useRealtimeLamMoi(
    'scripts',
    chapterId ? `chapter_id=eq.${chapterId}` : null,
    taiLaiDanhSach,
  );

  const taoPhienBanMoi = useCallback(async (content, source = 'ai') => {
    if (!user?.id || !chapterId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    setDangTaoKichBan(true);
    const { data, error } = await taoKichBanMoi(user, projectId, chapterId, content, source);
    setDangTaoKichBan(false);
    if (error) {
      setLoiKichBan(dichLoiKichBan(error, t));
      return { data: null, error };
    }
    setDanhSachKichBan((hienTai) => [data, ...hienTai]);
    return { data, error: null };
  }, [chapterId, projectId, t, user]);

  const taoTuAI = useCallback(async () => {
    if (!chapterId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    setDangTaoBangAI(true);
    setLoiKichBan('');
    const { data, error } = await taoKichBanBangAI(chapterId);
    setDangTaoBangAI(false);
    if (error) {
      setLoiKichBan(error.message || dichLoiKichBan(error, t));
      return { data: null, error };
    }
    setDanhSachKichBan((hienTai) => [data, ...hienTai]);
    return { data, error: null };
  }, [chapterId, t]);

  const suaKichBan = useCallback(async (scriptId, content) => {
    if (!userId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    const { data, error } = await capNhatKichBan(userId, scriptId, content);
    if (error) {
      setLoiKichBan(dichLoiKichBan(error, t));
      return { data: null, error };
    }
    setDanhSachKichBan((hienTai) => hienTai.map((kb) => (kb.id === scriptId ? data : kb)));
    return { data, error: null };
  }, [t, userId]);

  // Tao file PPT tu nen slide da co san trong 1 ban ghi kich ban.
  // Mac dinh dung phien ban moi nhat; truyen kichBanCuThe de chon ban khac.
  const taiPpt = useCallback(async (chuong, duAn, kichBanCuThe) => {
    const kichBan = kichBanCuThe || kichBanMoiNhat;
    setDangTaoPpt(true);
    setLoiPpt('');
    const { data, error } = await taoPptTuKichBan(kichBan, chuong, duAn);
    setDangTaoPpt(false);
    if (error) {
      setLoiPpt(error.message || t('scriptPage.errors.actionFailed'));
      return { data: null, error };
    }
    return { data, error: null };
  }, [kichBanMoiNhat, t]);

  const xoaPhienBan = useCallback(async (scriptId) => {
    if (!userId) return { error: { code: 'LOGIN_REQUIRED' } };
    const { error } = await xoaKichBan(userId, scriptId);
    if (error) {
      setLoiKichBan(dichLoiKichBan(error, t));
      return { error };
    }
    setDanhSachKichBan((hienTai) => hienTai.filter((kb) => kb.id !== scriptId));
    return { error: null };
  }, [t, userId]);

  return {
    danhSachKichBan,
    kichBanMoiNhat,
    dangTaiKichBan,
    loiKichBan,
    dangTaoKichBan,
    dangTaoBangAI,
    dangTaoPpt,
    loiPpt,
    taiLaiDanhSach,
    taoPhienBanMoi,
    taoTuAI,
    taiPpt,
    suaKichBan,
    xoaPhienBan,
  };
}

export default useKichBan;
