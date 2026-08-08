import { supabase } from './supabase';
import {
  layUrlVideo,
  taiFileVideo,
  xoaFileVideo,
} from './fileVideo';

const CAC_COT_VIDEO = [
  'id',
  'user_id',
  'project_id',
  'chapter_id',
  'name',
  'file_path',
  'duration_seconds',
  'resolution',
  'aspect_ratio',
  'fps',
  'format',
  'size_bytes',
  'status',
  'created_at',
  'rendered_at',
  'updated_at',
].join(', ');

function chuyenVideoSangGiaoDien(banGhi, fileUrl = '') {
  return {
    id: banGhi.id,
    userId: banGhi.user_id,
    projectId: banGhi.project_id,
    chapterId: banGhi.chapter_id,
    name: banGhi.name,
    filePath: banGhi.file_path,
    fileUrl,
    duration: Number(banGhi.duration_seconds) || 0,
    resolution: banGhi.resolution || '',
    aspectRatio: banGhi.aspect_ratio || '',
    fps: banGhi.fps,
    format: banGhi.format || '',
    sizeBytes: Number(banGhi.size_bytes) || 0,
    status: banGhi.status,
    createdAt: banGhi.created_at,
    renderedAt: banGhi.rendered_at,
    updatedAt: banGhi.updated_at,
  };
}

async function themUrlFile(banGhi) {
  if (!banGhi.file_path) return chuyenVideoSangGiaoDien(banGhi);
  const { data } = await layUrlVideo(banGhi.file_path);
  return chuyenVideoSangGiaoDien(banGhi, data?.url || '');
}

async function layDanhSachVideo(userId) {
  const { data, error } = await supabase
    .from('videos')
    .select(CAC_COT_VIDEO)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error };
  const danhSach = await Promise.all((data || []).map(themUrlFile));
  return { data: danhSach, error: null };
}

async function layDanhSachVideoTheoChuong(userId, chapterId) {
  const { data, error } = await supabase
    .from('videos')
    .select(CAC_COT_VIDEO)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error };
  const danhSach = await Promise.all((data || []).map(themUrlFile));
  return { data: danhSach, error: null };
}

async function taoVideoNguoiDung(user, file, projectId = null, chapterId = null) {
  const { data: video, error: insertError } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      chapter_id: chapterId || null,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file_path: '',
      size_bytes: file.size,
      status: 'rendering',
    })
    .select(CAC_COT_VIDEO)
    .single();

  if (insertError) return { data: null, error: insertError };

  const { data: taiLen, error: uploadError } = await taiFileVideo(user.id, video.id, file);
  if (uploadError) {
    await supabase.from('videos').delete().eq('id', video.id);
    return { data: null, error: uploadError };
  }

  const { data: updated, error: updateError } = await supabase
    .from('videos')
    .update({
      file_path: taiLen.path,
      format: taiLen.format,
      duration_seconds: taiLen.durationSeconds,
      resolution: taiLen.resolution,
      aspect_ratio: taiLen.aspectRatio,
      status: 'completed',
      rendered_at: new Date().toISOString(),
    })
    .eq('id', video.id)
    .eq('user_id', user.id)
    .select(CAC_COT_VIDEO)
    .single();

  if (updateError) {
    await xoaFileVideo(taiLen.path);
    await supabase.from('videos').delete().eq('id', video.id);
    return { data: null, error: updateError };
  }

  return { data: await themUrlFile(updated), error: null };
}

async function doiTenVideo(userId, videoId, tenMoi) {
  const { data, error } = await supabase
    .from('videos')
    .update({ name: tenMoi.trim() })
    .eq('id', videoId)
    .eq('user_id', userId)
    .select(CAC_COT_VIDEO)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function diChuyenVideo(userId, videoId, projectId) {
  const { data, error } = await supabase
    .from('videos')
    .update({ project_id: projectId || null })
    .eq('id', videoId)
    .eq('user_id', userId)
    .select(CAC_COT_VIDEO)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function xoaVideo(userId, videoId, filePath) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)
    .eq('user_id', userId);

  if (error) return { error };
  await xoaFileVideo(filePath);
  return { error: null };
}

export {
  CAC_COT_VIDEO,
  chuyenVideoSangGiaoDien,
  diChuyenVideo,
  doiTenVideo,
  layDanhSachVideo,
  layDanhSachVideoTheoChuong,
  taoVideoNguoiDung,
  xoaVideo,
};
