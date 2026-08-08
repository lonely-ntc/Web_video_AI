import { supabase } from './supabase';

const CAC_COT_TASK = [
  'id',
  'user_id',
  'project_id',
  'video_id',
  'code',
  'name',
  'type',
  'status',
  'progress',
  'has_video',
  'error',
  'started_at',
  'finished_at',
  'created_at',
  'updated_at',
].join(', ');

const CAC_COT_BUOC = [
  'id',
  'task_id',
  'step_index',
  'code',
  'name',
  'status',
  'started_at',
  'finished_at',
  'duration_seconds',
  'message',
].join(', ');

function chuyenBuocSangGiaoDien(banGhi) {
  return {
    id: banGhi.code,
    name: banGhi.name,
    status: banGhi.status,
    startedAt: banGhi.started_at,
    finishedAt: banGhi.finished_at,
    durationSeconds: Number(banGhi.duration_seconds) || 0,
    message: banGhi.message || '',
  };
}

function chuyenTacVuSangGiaoDien(banGhi, danhSachBuoc = []) {
  return {
    id: banGhi.id,
    code: banGhi.code,
    name: banGhi.name,
    projectId: banGhi.project_id,
    videoId: banGhi.video_id,
    type: banGhi.type,
    status: banGhi.status,
    progress: Number(banGhi.progress) || 0,
    hasVideo: Boolean(banGhi.has_video),
    error: banGhi.error || null,
    startedAt: banGhi.started_at,
    finishedAt: banGhi.finished_at,
    createdAt: banGhi.created_at,
    updatedAt: banGhi.updated_at,
    pipeline: danhSachBuoc
      .filter((buoc) => buoc.task_id === banGhi.id)
      .sort((a, b) => a.step_index - b.step_index)
      .map(chuyenBuocSangGiaoDien),
  };
}

async function layDanhSachLichSu(userId) {
  const { data: tasks, error: loiTasks } = await supabase
    .from('tasks')
    .select(CAC_COT_TASK)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (loiTasks) return { data: null, error: loiTasks };
  if (!tasks?.length) return { data: [], error: null };

  const { data: steps, error: loiSteps } = await supabase
    .from('task_steps')
    .select(CAC_COT_BUOC)
    .in('task_id', tasks.map((task) => task.id));

  if (loiSteps) return { data: null, error: loiSteps };

  return {
    data: tasks.map((task) => chuyenTacVuSangGiaoDien(task, steps || [])),
    error: null,
  };
}

async function huyTacVu(userId, taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'cancelled', finished_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .select(CAC_COT_TASK)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenTacVuSangGiaoDien(data), error: null };
}

async function chayLaiTacVu(userId, taskId) {
  const { error: loiXoaBuoc } = await supabase
    .from('task_steps')
    .delete()
    .eq('task_id', taskId);

  if (loiXoaBuoc) return { data: null, error: loiXoaBuoc };

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'pending',
      progress: 0,
      error: null,
      finished_at: null,
      started_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select(CAC_COT_TASK)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenTacVuSangGiaoDien(data), error: null };
}

async function xoaTacVu(userId, taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) return { error };
  return { error: null };
}

export {
  CAC_COT_TASK,
  chayLaiTacVu,
  chuyenTacVuSangGiaoDien,
  huyTacVu,
  layDanhSachLichSu,
  xoaTacVu,
};
