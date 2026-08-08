import { supabase } from './supabase';
import {
  layUrlAnhBiaDuAn,
  taiAnhBiaDuAn,
  xoaAnhBiaDuAn,
} from './anhBiaDuAn';

const CAC_COT_DU_AN = [
  'id',
  'user_id',
  'name',
  'description',
  'category',
  'default_language',
  'video_template',
  'cover_path',
  'default_settings_enabled',
  'default_avatar_id',
  'default_voice_id',
  'aspect_ratio',
  'resolution',
  'status',
  'progress',
  'document_count',
  'video_count',
  'archived_at',
  'created_at',
  'updated_at',
].join(', ');

const TRANG_THAI_GIAO_DIEN = {
  draft: 'inProgress',
  in_progress: 'inProgress',
  completed: 'completed',
  archived: 'archived',
};

function taoBanGhiDuAn(userId, duLieu) {
  return {
    user_id: userId,
    name: duLieu.name.trim(),
    description: duLieu.description.trim(),
    category: duLieu.category,
    default_language: duLieu.language,
    video_template: duLieu.template,
    default_settings_enabled: Boolean(duLieu.defaultSettingsEnabled),
    default_avatar_id: duLieu.defaultAvatar || '',
    default_voice_id: duLieu.defaultVoice || '',
    aspect_ratio: duLieu.defaultSettingsEnabled ? duLieu.aspectRatio || null : null,
    resolution: duLieu.defaultSettingsEnabled ? duLieu.resolution || null : null,
    status: 'in_progress',
    progress: 0,
  };
}

function chuyenDuAnSangGiaoDien(banGhi, coverUrl = '') {
  return {
    id: banGhi.id,
    userId: banGhi.user_id,
    name: banGhi.name,
    description: banGhi.description || '',
    category: banGhi.category,
    defaultLanguage: banGhi.default_language,
    template: banGhi.video_template,
    coverPath: banGhi.cover_path || '',
    coverUrl,
    defaultSettingsEnabled: Boolean(banGhi.default_settings_enabled),
    defaultAvatar: banGhi.default_avatar_id || '',
    defaultVoice: banGhi.default_voice_id || '',
    aspectRatio: banGhi.aspect_ratio || '',
    resolution: banGhi.resolution || '',
    status: TRANG_THAI_GIAO_DIEN[banGhi.status] || 'inProgress',
    progress: Number(banGhi.progress) || 0,
    documentCount: Number(banGhi.document_count) || 0,
    videoCount: Number(banGhi.video_count) || 0,
    archivedAt: banGhi.archived_at,
    createdAt: banGhi.created_at,
    updatedAt: banGhi.updated_at,
  };
}

async function themUrlAnhBia(banGhi) {
  if (!banGhi.cover_path) return chuyenDuAnSangGiaoDien(banGhi);
  const { data } = await layUrlAnhBiaDuAn(banGhi.cover_path);
  return chuyenDuAnSangGiaoDien(banGhi, data?.url || '');
}

async function layDanhSachDuAn(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select(CAC_COT_DU_AN)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error };
  const danhSach = await Promise.all((data || []).map(themUrlAnhBia));
  return { data: danhSach, error: null };
}

async function taoDuAnNguoiDung(user, duLieu) {
  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert(taoBanGhiDuAn(user.id, duLieu))
    .select(CAC_COT_DU_AN)
    .single();

  if (insertError) return { data: null, error: insertError };
  if (!duLieu.coverFile) {
    return { data: chuyenDuAnSangGiaoDien(project), error: null };
  }

  const { data: cover, error: uploadError } = await taiAnhBiaDuAn(
    user.id,
    project.id,
    duLieu.coverFile,
  );

  if (uploadError) {
    await supabase.from('projects').delete().eq('id', project.id);
    return { data: null, error: uploadError };
  }

  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update({ cover_path: cover.path })
    .eq('id', project.id)
    .eq('user_id', user.id)
    .select(CAC_COT_DU_AN)
    .single();

  if (updateError) {
    await xoaAnhBiaDuAn(cover.path);
    await supabase.from('projects').delete().eq('id', project.id);
    return { data: null, error: updateError };
  }

  return { data: await themUrlAnhBia(updatedProject), error: null };
}

function taoBanGhiCapNhat(duLieu) {
  const banGhi = {
    name: duLieu.name.trim(),
    description: duLieu.description.trim(),
    video_template: duLieu.template,
    default_language: duLieu.language,
    default_settings_enabled: Boolean(duLieu.defaultSettingsEnabled),
    default_avatar_id: duLieu.defaultSettingsEnabled ? (duLieu.defaultAvatar || '') : '',
    default_voice_id: duLieu.defaultSettingsEnabled ? (duLieu.defaultVoice || '') : '',
    aspect_ratio: duLieu.defaultSettingsEnabled ? (duLieu.aspectRatio || null) : null,
    resolution: duLieu.defaultSettingsEnabled ? (duLieu.resolution || null) : null,
  };
  return banGhi;
}

async function capNhatDuAn(userId, projectId, duLieu) {
  const { data, error } = await supabase
    .from('projects')
    .update(taoBanGhiCapNhat(duLieu))
    .eq('id', projectId)
    .eq('user_id', userId)
    .select(CAC_COT_DU_AN)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlAnhBia(data), error: null };
}

async function doiTrangThaiDuAn(userId, projectId, trangThai) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      status: trangThai,
      archived_at: trangThai === 'archived' ? new Date().toISOString() : null,
    })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select(CAC_COT_DU_AN)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlAnhBia(data), error: null };
}

async function xoaDuAnNguoiDung(userId, projectId, coverPath) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) return { error };
  if (coverPath) await xoaAnhBiaDuAn(coverPath);
  return { error: null };
}

export {
  CAC_COT_DU_AN,
  capNhatDuAn,
  chuyenDuAnSangGiaoDien,
  doiTrangThaiDuAn,
  layDanhSachDuAn,
  taoBanGhiDuAn,
  taoDuAnNguoiDung,
  xoaDuAnNguoiDung,
};
