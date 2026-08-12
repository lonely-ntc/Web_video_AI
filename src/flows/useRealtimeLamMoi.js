import { useEffect, useRef } from 'react';
import { supabase } from '../database/supabase';

// Lang nghe thay doi (insert/update/delete) tren mot bang Supabase va goi
// lai ham lam moi du lieu (thuong la ham fetch danh sach da co san trong
// cac hook use*), thay vi tu ghep patch tung ban ghi mot cach thu cong.
// RLS cua Supabase Realtime tu dong gioi han chi nhan event cua du lieu
// nguoi dung dang dang nhap duoc phep xem, ke ca khi khong truyen filter
// (vi du bang khong co cot user_id truc tiep nhu task_steps).
//
// dieuKienLoc: chuoi filter dang "cot=eq.gia_tri", hoac true de dang ky
// khong loc theo cot nao (chi dua vao RLS), hoac false/null/undefined de
// tam thoi khong dang ky (vi du khi chua co userId).
function useRealtimeLamMoi(bang, dieuKienLoc, onThayDoi) {
  const onThayDoiRef = useRef(onThayDoi);
  onThayDoiRef.current = onThayDoi;

  const daKichHoat = dieuKienLoc === true || typeof dieuKienLoc === 'string';
  const khoaKenh = dieuKienLoc === true ? 'all' : dieuKienLoc;

  useEffect(() => {
    if (!daKichHoat) return undefined;

    const cauHinh = { event: '*', schema: 'public', table: bang };
    if (typeof dieuKienLoc === 'string') cauHinh.filter = dieuKienLoc;

    const kenh = supabase
      .channel(`realtime-${bang}-${khoaKenh}`)
      .on('postgres_changes', cauHinh, () => onThayDoiRef.current?.())
      .subscribe();

    return () => {
      supabase.removeChannel(kenh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bang, khoaKenh, daKichHoat]);
}

export default useRealtimeLamMoi;
