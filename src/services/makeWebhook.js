// Goi webhook Make.com (Integromat) de kich hoat pipeline automation
// (tao slide PPT, ghep avatar + slide bang FFmpeg...) chay tren may local
// thong qua ngrok/gateway-service. Giong cac service khac trong thu muc
// nay, day chi la 1 lop fetch don gian.

const MAKE_WEBHOOK_URL = process.env.REACT_APP_MAKE_WEBHOOK_URL || '';

// duLieu: object JSON se duoc gui nguyen ven cho Make (vd: chapterId,
// script, voiceId, avatarImageUrl...). Khong chan luong chinh cua UI neu
// loi - tra ve { error } de noi goi tu quyet dinh co hien thong bao hay khong.
async function goiWebhookTaoVideo(duLieu) {
  if (!MAKE_WEBHOOK_URL) {
    return { data: null, error: { code: 'MAKE_WEBHOOK_NOT_CONFIGURED', message: 'Chưa cấu hình REACT_APP_MAKE_WEBHOOK_URL.' } };
  }
  try {
    const phanHoi = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duLieu),
    });
    if (!phanHoi.ok) {
      return { data: null, error: { code: 'MAKE_WEBHOOK_FAILED', message: `Make webhook trả lỗi (HTTP ${phanHoi.status}).` } };
    }
    let noiDung = null;
    try {
      noiDung = await phanHoi.json();
    } catch {
      // Make co the tra ve text rong khi khong co module "Webhook response"
    }
    return { data: noiDung, error: null };
  } catch {
    return { data: null, error: { code: 'MAKE_WEBHOOK_UNAVAILABLE', message: 'Không gọi được Make webhook.' } };
  }
}

export { goiWebhookTaoVideo };
