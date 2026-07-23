import { useEffect, useState } from 'react';

const KHOA_LUU_CAI_DAT = 'ai-video-studio-settings';

const caiDatMacDinh = {
  theme: 'light',
  language: 'vi',
  fontSize: 'medium',
  notifications: {
    videoCompleted: true,
    documentUploaded: true,
    videoFailed: true,
    systemUpdates: true,
  },
};

function docCaiDatDaLuu() {
  try {
    const duLieuDaLuu = window.localStorage.getItem(KHOA_LUU_CAI_DAT);
    if (!duLieuDaLuu) return caiDatMacDinh;

    const duLieu = JSON.parse(duLieuDaLuu);
    return {
      ...caiDatMacDinh,
      ...duLieu,
      notifications: {
        ...caiDatMacDinh.notifications,
        ...duLieu.notifications,
      },
    };
  } catch {
    return caiDatMacDinh;
  }
}

function useCaiDat() {
  const [caiDat, setCaiDat] = useState(docCaiDatDaLuu);

  useEffect(() => {
    const phanTuGoc = document.documentElement;
    const kichThuocChu = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };

    phanTuGoc.dataset.theme = caiDat.theme;
    phanTuGoc.dataset.fontSize = caiDat.fontSize;
    phanTuGoc.lang = caiDat.language;
    phanTuGoc.style.fontSize = kichThuocChu[caiDat.fontSize] || kichThuocChu.medium;

    try {
      window.localStorage.setItem(KHOA_LUU_CAI_DAT, JSON.stringify(caiDat));
    } catch {
      // Giao dien van hoat dong neu trinh duyet chan localStorage.
    }
  }, [caiDat]);

  const capNhatGiaoDien = (tenCaiDat, giaTri) => {
    setCaiDat((hienTai) => ({ ...hienTai, [tenCaiDat]: giaTri }));
  };

  const batTatThongBao = (tenThongBao) => {
    setCaiDat((hienTai) => ({
      ...hienTai,
      notifications: {
        ...hienTai.notifications,
        [tenThongBao]: !hienTai.notifications[tenThongBao],
      },
    }));
  };

  return { caiDat, capNhatGiaoDien, batTatThongBao };
}

export default useCaiDat;
