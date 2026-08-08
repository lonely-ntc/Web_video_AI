import { supabase } from './supabase';

const CAC_COT_CHUONG = [
  'id',
  'user_id',
  'project_id',
  'name',
  'description',
  'order_index',
  'document_count',
  'video_count',
  'progress',
  'status',
  'script',
  'selected_avatar_id',
  'selected_voice_id',
  'created_at',
  'updated_at',
].join(', ');

const TRANG_THAI_HOP_LE = ['not_started', 'creating_script', 'creating_video', 'completed'];

function chuyenChuongSangGiaoDien(banGhi) {
  return {
    id: banGhi.id,
    projectId: banGhi.project_id,
    name: banGhi.name,
    description: banGhi.description || '',
    orderIndex: Number(banGhi.order_index) || 0,
    documentCount: Number(banGhi.document_count) || 0,
    videoCount: Number(banGhi.video_count) || 0,
    progress: Number(banGhi.progress) || 0,
    status: TRANG_THAI_HOP_LE.includes(banGhi.status) ? banGhi.status : 'not_started',
    script: banGhi.script || '',
    selectedAvatarId: banGhi.selected_avatar_id || '',
    selectedVoiceId: banGhi.selected_voice_id || '',
    createdAt: banGhi.created_at,
    updatedAt: banGhi.updated_at,
  };
}

async function layDanhSachChuong(userId, projectId) {
  const { data, error } = await supabase
    .from('chapters')
    .select(CAC_COT_CHUONG)
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) return { data: null, error };
  return { data: (data || []).map(chuyenChuongSangGiaoDien), error: null };
}

async function layChuongTheoId(userId, chuongId) {
  const { data, error } = await supabase
    .from('chapters')
    .select(CAC_COT_CHUONG)
    .eq('user_id', userId)
    .eq('id', chuongId)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenChuongSangGiaoDien(data), error: null };
}

async function taoChuongMoi(user, projectId, duLieu, viTri = 0) {
  const { data, error } = await supabase
    .from('chapters')
    .insert({
      user_id: user.id,
      project_id: projectId,
      name: duLieu.name.trim(),
      description: (duLieu.description || '').trim(),
      order_index: viTri,
    })
    .select(CAC_COT_CHUONG)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenChuongSangGiaoDien(data), error: null };
}

async function capNhatChuong(userId, chuongId, duLieu) {
  const { data, error } = await supabase
    .from('chapters')
    .update({
      name: duLieu.name.trim(),
      description: (duLieu.description || '').trim(),
    })
    .eq('id', chuongId)
    .eq('user_id', userId)
    .select(CAC_COT_CHUONG)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenChuongSangGiaoDien(data), error: null };
}

async function capNhatKichBanChuong(userId, chuongId, kichBan) {
  const { data, error } = await supabase
    .from('chapters')
    .update({ script: kichBan })
    .eq('id', chuongId)
    .eq('user_id', userId)
    .select(CAC_COT_CHUONG)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenChuongSangGiaoDien(data), error: null };
}

async function chonAvatarChuong(userId, chuongId, avatarId) {
  const { data, error } = await supabase
    .from('chapters')
    .update({ selected_avatar_id: avatarId || null })
    .eq('id', chuongId)
    .eq('user_id', userId)
    .select(CAC_COT_CHUONG)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenChuongSangGiaoDien(data), error: null };
}

async function chonVoiceChuong(userId, chuongId, voiceId) {
  const { data, error } = await supabase
    .from('chapters')
    .update({ selected_voice_id: voiceId || '' })
    .eq('id', chuongId)
    .eq('user_id', userId)
    .select(CAC_COT_CHUONG)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenChuongSangGiaoDien(data), error: null };
}

async function xoaChuong(userId, chuongId) {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chuongId)
    .eq('user_id', userId);

  return { error: error || null };
}

export {
  CAC_COT_CHUONG,
  capNhatChuong,
  capNhatKichBanChuong,
  chonAvatarChuong,
  chonVoiceChuong,
  chuyenChuongSangGiaoDien,
  layChuongTheoId,
  layDanhSachChuong,
  taoChuongMoi,
  xoaChuong,
};
