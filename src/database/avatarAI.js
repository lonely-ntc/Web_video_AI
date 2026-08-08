import { supabase } from './supabase';
import {
  layUrlAvatarAI,
  taiFileAvatarAI,
  xoaFileAvatarAI,
} from './fileAvatarAI';

const CAC_COT_AVATAR = [
  'id',
  'user_id',
  'project_id',
  'name',
  'file_path',
  'format',
  'size_bytes',
  'width',
  'height',
  'is_default',
  'created_at',
  'updated_at',
].join(', ');

function chuyenAvatarSangGiaoDien(banGhi, fileUrl = '') {
  return {
    id: banGhi.id,
    userId: banGhi.user_id,
    projectId: banGhi.project_id,
    name: banGhi.name,
    filePath: banGhi.file_path,
    fileUrl,
    format: banGhi.format,
    sizeBytes: Number(banGhi.size_bytes) || 0,
    width: banGhi.width,
    height: banGhi.height,
    isDefault: Boolean(banGhi.is_default),
    createdAt: banGhi.created_at,
    updatedAt: banGhi.updated_at,
  };
}

async function themUrlFile(banGhi) {
  const { data } = await layUrlAvatarAI(banGhi.file_path);
  return chuyenAvatarSangGiaoDien(banGhi, data?.url || '');
}

async function layDanhSachAvatarAI(userId) {
  const { data, error } = await supabase
    .from('ai_avatars')
    .select(CAC_COT_AVATAR)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error };
  const danhSach = await Promise.all((data || []).map(themUrlFile));
  return { data: danhSach, error: null };
}

async function taoAvatarAINguoiDung(user, file, projectId = null) {
  const { data: avatar, error: insertError } = await supabase
    .from('ai_avatars')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file_path: '',
      format: 'PNG',
      size_bytes: file.size,
    })
    .select(CAC_COT_AVATAR)
    .single();

  if (insertError) return { data: null, error: insertError };

  const { data: taiLen, error: uploadError } = await taiFileAvatarAI(user.id, avatar.id, file);
  if (uploadError) {
    await supabase.from('ai_avatars').delete().eq('id', avatar.id);
    return { data: null, error: uploadError };
  }

  const { data: updated, error: updateError } = await supabase
    .from('ai_avatars')
    .update({
      file_path: taiLen.path,
      format: taiLen.format,
      width: taiLen.width,
      height: taiLen.height,
    })
    .eq('id', avatar.id)
    .eq('user_id', user.id)
    .select(CAC_COT_AVATAR)
    .single();

  if (updateError) {
    await xoaFileAvatarAI(taiLen.path);
    await supabase.from('ai_avatars').delete().eq('id', avatar.id);
    return { data: null, error: updateError };
  }

  return { data: await themUrlFile(updated), error: null };
}

async function doiTenAvatarAI(userId, avatarId, tenMoi) {
  const { data, error } = await supabase
    .from('ai_avatars')
    .update({ name: tenMoi.trim() })
    .eq('id', avatarId)
    .eq('user_id', userId)
    .select(CAC_COT_AVATAR)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function datAvatarMacDinh(userId, avatarId) {
  const { error: boChonError } = await supabase
    .from('ai_avatars')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);

  if (boChonError) return { data: null, error: boChonError };

  const { data, error } = await supabase
    .from('ai_avatars')
    .update({ is_default: true })
    .eq('id', avatarId)
    .eq('user_id', userId)
    .select(CAC_COT_AVATAR)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function diChuyenAvatarAI(userId, avatarId, projectId) {
  const { data, error } = await supabase
    .from('ai_avatars')
    .update({ project_id: projectId || null })
    .eq('id', avatarId)
    .eq('user_id', userId)
    .select(CAC_COT_AVATAR)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function xoaAvatarAI(userId, avatarId, filePath) {
  const { error } = await supabase
    .from('ai_avatars')
    .delete()
    .eq('id', avatarId)
    .eq('user_id', userId);

  if (error) return { error };
  await xoaFileAvatarAI(filePath);
  return { error: null };
}

export {
  CAC_COT_AVATAR,
  chuyenAvatarSangGiaoDien,
  datAvatarMacDinh,
  diChuyenAvatarAI,
  doiTenAvatarAI,
  layDanhSachAvatarAI,
  taoAvatarAINguoiDung,
  xoaAvatarAI,
};
