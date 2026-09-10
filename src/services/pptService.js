// Goi service Python/Node noi bo (ppt-service/server.js, chay PptxGenJS)
// de tao file PowerPoint bai giang tu cau truc slide. Giong ttsGiongDoc.js
// va avatarService.js: chi la mot REST API don gian chay o localhost.

const PPT_API_URL = process.env.REACT_APP_PPT_API_URL || 'http://127.0.0.1:8003';

async function kiemTraPptServer() {
  try {
    const phanHoi = await fetch(`${PPT_API_URL}/health`);
    return phanHoi.ok;
  } catch {
    return false;
  }
}

// baiGiang: {
//   title, subtitle?, author?, mucLuc?, theme?,
//   slides: [{ type, title?, subtitle?, bullets?, image?, caption?, note? }]
// }
// Xem local-ai/ppt-service/lib/xayDungBaiGiang.js de biet cau truc day du.
async function taoBaiGiangPpt(baiGiang) {
  if (!baiGiang?.title?.trim()) {
    return { data: null, error: { code: 'MISSING_INPUT', message: 'Thiếu tiêu đề bài giảng.' } };
  }

  try {
    const phanHoi = await fetch(`${PPT_API_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baiGiang),
    });

    if (!phanHoi.ok) {
      let thongDiep = 'Không thể tạo file PowerPoint.';
      try {
        const loi = await phanHoi.json();
        thongDiep = loi.detail || thongDiep;
      } catch {
        // giu thong diep mac dinh khi than loi khong phai JSON
      }
      return { data: null, error: { code: 'PPT_GENERATE_FAILED', message: thongDiep } };
    }

    const blob = await phanHoi.blob();
    const tenFile = docTenFile(phanHoi.headers.get('Content-Disposition')) || 'bai-giang.pptx';
    return {
      data: { blob, fileUrl: URL.createObjectURL(blob), fileName: tenFile },
      error: null,
    };
  } catch {
    return { data: null, error: { code: 'PPT_UNAVAILABLE', message: 'Không kết nối được tới PPT server.' } };
  }
}

function docTenFile(contentDisposition) {
  if (!contentDisposition) return null;
  const khop = /filename="?([^"]+)"?/.exec(contentDisposition);
  return khop ? khop[1] : null;
}

export {
  kiemTraPptServer,
  taoBaiGiangPpt,
};
