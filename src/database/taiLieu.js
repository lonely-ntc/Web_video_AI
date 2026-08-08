import { supabase } from './supabase';
import {
  layUrlFileTaiLieu,
  suyLuanLoaiFile,
  taiFileTaiLieu,
  xoaFileTaiLieu,
} from './fileTaiLieu';

const CAC_COT_TAI_LIEU = [
  'id',
  'user_id',
  'project_id',
  'chapter_id',
  'name',
  'file_path',
  'file_type',
  'size_bytes',
  'status',
  'created_at',
  'updated_at',
].join(', ');

function chuyenTaiLieuSangGiaoDien(banGhi, fileUrl = '') {
  return {
    id: banGhi.id,
    userId: banGhi.user_id,
    projectId: banGhi.project_id,
    chapterId: banGhi.chapter_id,
    name: banGhi.name,
    filePath: banGhi.file_path,
    fileUrl,
    fileType: banGhi.file_type,
    sizeBytes: Number(banGhi.size_bytes) || 0,
    status: banGhi.status,
    createdAt: banGhi.created_at,
    updatedAt: banGhi.updated_at,
  };
}

async function themUrlFile(banGhi) {
  const { data } = await layUrlFileTaiLieu(banGhi.file_path);
  return chuyenTaiLieuSangGiaoDien(banGhi, data?.url || '');
}

async function layDanhSachTaiLieu(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select(CAC_COT_TAI_LIEU)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error };
  const danhSach = await Promise.all((data || []).map(themUrlFile));
  return { data: danhSach, error: null };
}

async function layDanhSachTaiLieuTheoChuong(userId, chapterId) {
  const { data, error } = await supabase
    .from('documents')
    .select(CAC_COT_TAI_LIEU)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error };
  const danhSach = await Promise.all((data || []).map(themUrlFile));
  return { data: danhSach, error: null };
}

async function taoTaiLieuNguoiDung(user, file, projectId = null, chapterId = null) {
  const { data: document, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      chapter_id: chapterId || null,
      name: file.name,
      file_path: '',
      file_type: suyLuanLoaiFile(file) || 'txt',
      size_bytes: file.size,
      status: 'processing',
    })
    .select(CAC_COT_TAI_LIEU)
    .single();

  if (insertError) return { data: null, error: insertError };

  const { data: taiLen, error: uploadError } = await taiFileTaiLieu(user.id, document.id, file);
  if (uploadError) {
    await supabase.from('documents').delete().eq('id', document.id);
    return { data: null, error: uploadError };
  }

  const { data: updated, error: updateError } = await supabase
    .from('documents')
    .update({ file_path: taiLen.path, file_type: taiLen.fileType, status: 'ready' })
    .eq('id', document.id)
    .eq('user_id', user.id)
    .select(CAC_COT_TAI_LIEU)
    .single();

  if (updateError) {
    await xoaFileTaiLieu(taiLen.path);
    await supabase.from('documents').delete().eq('id', document.id);
    return { data: null, error: updateError };
  }

  return { data: await themUrlFile(updated), error: null };
}

async function doiTenTaiLieu(userId, documentId, tenMoi) {
  const { data, error } = await supabase
    .from('documents')
    .update({ name: tenMoi.trim() })
    .eq('id', documentId)
    .eq('user_id', userId)
    .select(CAC_COT_TAI_LIEU)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function diChuyenTaiLieu(userId, documentId, projectId) {
  const { data, error } = await supabase
    .from('documents')
    .update({ project_id: projectId || null })
    .eq('id', documentId)
    .eq('user_id', userId)
    .select(CAC_COT_TAI_LIEU)
    .single();

  if (error) return { data: null, error };
  return { data: await themUrlFile(data), error: null };
}

async function xoaTaiLieu(userId, documentId, filePath) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (error) return { error };
  await xoaFileTaiLieu(filePath);
  return { error: null };
}

export {
  CAC_COT_TAI_LIEU,
  chuyenTaiLieuSangGiaoDien,
  diChuyenTaiLieu,
  doiTenTaiLieu,
  layDanhSachTaiLieu,
  layDanhSachTaiLieuTheoChuong,
  taoTaiLieuNguoiDung,
  xoaTaiLieu,
};
