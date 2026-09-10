// Cau noi: tu ban ghi kich ban (co san mang `slides` do AI tao) -> goi
// ppt-service tao file .pptx. Dung chung convention { data, error }.

import { taoBaiGiangPpt, kiemTraPptServer } from './pptService';

// kichBan: object tu chuyenKichBanSangGiaoDien (co .slides, .content)
// chuong:  { name } ; duAn: { name } (tuy chon, lam phu de)
function ghepBaiGiang(kichBan, chuong, duAn) {
  return {
    title: chuong?.name || 'Bài giảng',
    subtitle: duAn?.name || undefined,
    author: 'AI Video System',
    mucLuc: true,
    fileName: `bai-giang-${chuong?.name || 'khong-ten'}`,
    slides: Array.isArray(kichBan?.slides) ? kichBan.slides : [],
  };
}

async function taoPptTuKichBan(kichBan, chuong, duAn) {
  const slides = Array.isArray(kichBan?.slides) ? kichBan.slides : [];
  if (slides.length === 0) {
    return {
      data: null,
      error: {
        code: 'NO_SLIDES',
        message: 'Kịch bản này chưa có nội dung slide. Hãy tạo lại kịch bản bằng AI.',
      },
    };
  }
  return taoBaiGiangPpt(ghepBaiGiang(kichBan, chuong, duAn));
}

export {
  ghepBaiGiang,
  taoPptTuKichBan,
  kiemTraPptServer,
};
