import { useCallback, useEffect, useRef, useState } from 'react';
import { layAmThanhMoiNhatTheoChuong, luuAmThanhGiongDoc } from '../database/amThanhGiongDoc';
import { layDanhSachGiongDoc, taoGiongDoc } from '../services/ttsGiongDoc';

// Nghe thu (taoAmThanhThuNghiem) chi phat tam thoi o trinh duyet, KHONG
// dong cham Supabase. Chi khi goi xacNhanGiong (nguoi dung bam "Chon giong
// nay") moi tao lai am thanh tu kich ban day du va upload len Supabase
// Storage + luu vao bang voice_audio.
function useTtsGiongDoc(user, projectId, chapterId) {
  const userId = user?.id;

  const [danhSachGiong, setDanhSachGiong] = useState([]);
  const [dangTaiGiong, setDangTaiGiong] = useState(true);
  const [loiTaiGiong, setLoiTaiGiong] = useState('');

  const [dangTaoAudio, setDangTaoAudio] = useState(false);
  const [loiTaoAudio, setLoiTaoAudio] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const audioUrlRef = useRef('');
  audioUrlRef.current = audioUrl;

  const [amThanhDaXacNhan, setAmThanhDaXacNhan] = useState(null);
  const [dangTaiAmThanhDaXacNhan, setDangTaiAmThanhDaXacNhan] = useState(Boolean(chapterId));
  const [dangXacNhanGiong, setDangXacNhanGiong] = useState(false);
  const [loiXacNhanGiong, setLoiXacNhanGiong] = useState('');

  const taiDanhSachGiong = useCallback(async () => {
    setDangTaiGiong(true);
    setLoiTaiGiong('');
    const { data, error } = await layDanhSachGiongDoc();
    if (error) {
      setLoiTaiGiong(error.message);
      setDangTaiGiong(false);
      return { data: null, error };
    }
    setDanhSachGiong(data || []);
    setDangTaiGiong(false);
    return { data: data || [], error: null };
  }, []);

  useEffect(() => {
    taiDanhSachGiong();
  }, [taiDanhSachGiong]);

  useEffect(() => {
    let conHoatDong = true;

    const taiAmThanhDaXacNhan = async () => {
      if (!userId || !chapterId) {
        setAmThanhDaXacNhan(null);
        setDangTaiAmThanhDaXacNhan(false);
        return;
      }
      setDangTaiAmThanhDaXacNhan(true);
      const { data } = await layAmThanhMoiNhatTheoChuong(userId, chapterId);
      if (!conHoatDong) return;
      setAmThanhDaXacNhan(data);
      setDangTaiAmThanhDaXacNhan(false);
    };

    taiAmThanhDaXacNhan();
    return () => { conHoatDong = false; };
  }, [chapterId, userId]);

  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const taoAmThanhThuNghiem = useCallback(async (vanBan, giongId) => {
    if (!vanBan?.trim() || !giongId) return { data: null, error: { code: 'MISSING_INPUT' } };

    setDangTaoAudio(true);
    setLoiTaoAudio('');
    const { data, error } = await taoGiongDoc(vanBan, giongId);
    setDangTaoAudio(false);

    if (error) {
      setLoiTaoAudio(error.message);
      return { data: null, error };
    }

    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    setAudioUrl(data.audioUrl);
    return { data, error: null };
  }, []);

  const xacNhanGiong = useCallback(async (vanBanDayDu, thongTinGiong) => {
    if (!user?.id || !chapterId) return { data: null, error: { code: 'LOGIN_REQUIRED' } };
    if (!vanBanDayDu?.trim() || !thongTinGiong?.voiceId) return { data: null, error: { code: 'MISSING_INPUT' } };

    setDangXacNhanGiong(true);
    setLoiXacNhanGiong('');

    const { data: taoMoi, error: loiTao } = await taoGiongDoc(vanBanDayDu, thongTinGiong.voiceId);
    if (loiTao) {
      setDangXacNhanGiong(false);
      setLoiXacNhanGiong(loiTao.message);
      return { data: null, error: loiTao };
    }

    const { data, error } = await luuAmThanhGiongDoc(user, projectId, chapterId, taoMoi.blob, thongTinGiong);
    setDangXacNhanGiong(false);

    if (error) {
      setLoiXacNhanGiong(error.message);
      return { data: null, error };
    }

    setAmThanhDaXacNhan(data);
    return { data, error: null };
  }, [chapterId, projectId, user]);

  return {
    danhSachGiong,
    dangTaiGiong,
    loiTaiGiong,
    dangTaoAudio,
    loiTaoAudio,
    audioUrl,
    taoAmThanhThuNghiem,
    amThanhDaXacNhan,
    dangTaiAmThanhDaXacNhan,
    dangXacNhanGiong,
    loiXacNhanGiong,
    xacNhanGiong,
  };
}

export default useTtsGiongDoc;
