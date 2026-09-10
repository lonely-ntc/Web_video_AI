import { supabase } from './supabase';
import {
  layUrlAmThanhGiongDoc,
  taiFileAmThanhGiongDoc,
  xoaFileAmThanhGiongDoc,
} from './fileAmThanhGiongDoc';

const CAC_COT_AM_THANH = [
  'id',
  'user_id',
  'project_id',
  'chapter_id',
  'voice_id',
  'voice_name',
  'gender',
  'region',
  'file_path',
  'duration_seconds',
  'size_bytes',
  'created_at',
].join(', ');

function chuyenAmThanhSangGiaoDien(banGhi, fileUrl = '') {
  return {
    id: banGhi.id,
    userId: banGhi.user_id,
    projectId: banGhi.project_id,
    chapterId: banGhi.chapter_id,
    voiceId: banGhi.voice_id,
    voiceName: banGhi.voice_name,
    gender: banGhi.gender,
    region: banGhi.region,
    filePath: banGhi.file_path,
    fileUrl,
    durationSeconds: Number(banGhi.duration_seconds) || 0,
    sizeBytes: Number(banGhi.size_bytes) || 0,
    createdAt: banGhi.created_at,
  };
}

async function layAmThanhMoiNhatTheoChuong(userId, chapterId) {
  if (!userId || !chapterId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('voice_audio')
    .select(CAC_COT_AM_THANH)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };

  const { data: url } = await layUrlAmThanhGiongDoc(data.file_path);
  return { data: chuyenAmThanhSangGiaoDien(data, url?.url || ''), error: null };
}

async function luuAmThanhGiongDoc(user, projectId, chapterId, blob, thongTinGiong, thoiLuongGiay = 0) {
  const tenFile = `${thongTinGiong.voiceId}-${Date.now()}.wav`;
  const { data: taiLen, error: uploadError } = await taiFileAmThanhGiongDoc(user.id, chapterId, blob, tenFile);
  if (uploadError) return { data: null, error: uploadError };

  const { data, error } = await supabase
    .from('voice_audio')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      chapter_id: chapterId,
      voice_id: thongTinGiong.voiceId,
      voice_name: thongTinGiong.voiceName,
      gender: thongTinGiong.gender || 'unknown',
      region: thongTinGiong.region || 'unknown',
      file_path: taiLen.path,
      duration_seconds: thoiLuongGiay || taiLen.duration || 0,
      size_bytes: taiLen.sizeBytes,
    })
    .select(CAC_COT_AM_THANH)
    .single();

  if (error) {
    await xoaFileAmThanhGiongDoc(taiLen.path);
    return { data: null, error };
  }

  const { data: url } = await layUrlAmThanhGiongDoc(data.file_path);
  return { data: chuyenAmThanhSangGiaoDien(data, url?.url || ''), error: null };
}

export {
  CAC_COT_AM_THANH,
  chuyenAmThanhSangGiaoDien,
  layAmThanhMoiNhatTheoChuong,
  luuAmThanhGiongDoc,
};
