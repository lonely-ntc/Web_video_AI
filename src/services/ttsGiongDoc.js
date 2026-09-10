// Goi service Python noi bo (tts-service/app.py, chay VieNeu-TTS v3 Turbo)
// de lay danh sach giong doc va tao file audio tu kich ban. Service nay
// khong phai Supabase nen khong dung supabase-js, chi la mot REST API
// don gian chay o localhost (hoac may chu rieng khi deploy).

const TTS_API_URL = process.env.REACT_APP_TTS_API_URL || 'http://127.0.0.1:8001';

async function layDanhSachGiongDoc() {
  try {
    const phanHoi = await fetch(`${TTS_API_URL}/voices`);
    if (!phanHoi.ok) {
      return { data: null, error: { code: 'TTS_VOICES_FAILED', message: 'Không thể tải danh sách giọng đọc.' } };
    }

    const noiDung = await phanHoi.json();
    return { data: noiDung.voices || [], error: null };
  } catch {
    return { data: null, error: { code: 'TTS_UNAVAILABLE', message: 'Không kết nối được tới TTS server.' } };
  }
}

async function taoGiongDoc(vanBan, giongId) {
  try {
    const phanHoi = await fetch(`${TTS_API_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: vanBan, voice: giongId }),
    });

    if (!phanHoi.ok) {
      let thongDiep = 'Không thể tạo giọng đọc.';
      try {
        const loi = await phanHoi.json();
        thongDiep = loi.detail || thongDiep;
      } catch {
        // giu thong diep mac dinh khi than loi khong phai JSON
      }
      return { data: null, error: { code: 'TTS_GENERATE_FAILED', message: thongDiep } };
    }

    const audioBlob = await phanHoi.blob();
    return { data: { blob: audioBlob, audioUrl: URL.createObjectURL(audioBlob) }, error: null };
  } catch {
    return { data: null, error: { code: 'TTS_UNAVAILABLE', message: 'Không kết nối được tới TTS server.' } };
  }
}

export {
  layDanhSachGiongDoc,
  taoGiongDoc,
};
