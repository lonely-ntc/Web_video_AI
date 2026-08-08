import { createContext, useContext, useMemo } from 'react';
import banDich from '../locales/banDich';

const NGON_NGU_MAC_DINH = 'vi';

function layBanDich(ngonNgu, khoa) {
  return khoa.split('.').reduce((giaTri, phan) => giaTri?.[phan], banDich[ngonNgu]);
}

function thayBien(noiDung, bien = {}) {
  if (typeof noiDung !== 'string') return noiDung;

  return noiDung.replace(/\{\{(\w+)\}\}/g, (_, tenBien) => (
    Object.prototype.hasOwnProperty.call(bien, tenBien) ? String(bien[tenBien]) : ''
  ));
}

const NgonNguContext = createContext({
  language: NGON_NGU_MAC_DINH,
  locale: 'vi-VN',
  t: (khoa, bien) => thayBien(layBanDich(NGON_NGU_MAC_DINH, khoa) || khoa, bien),
});

function NgonNguProvider({ language, children }) {
  const ngonNgu = banDich[language] ? language : NGON_NGU_MAC_DINH;
  const giaTri = useMemo(() => ({
    language: ngonNgu,
    locale: ngonNgu === 'en' ? 'en-US' : 'vi-VN',
    t: (khoa, bien) => {
      const noiDung = layBanDich(ngonNgu, khoa)
        ?? layBanDich(NGON_NGU_MAC_DINH, khoa)
        ?? khoa;
      return thayBien(noiDung, bien);
    },
  }), [ngonNgu]);

  return (
    <NgonNguContext.Provider value={giaTri}>
      {children}
    </NgonNguContext.Provider>
  );
}

function useNgonNgu() {
  return useContext(NgonNguContext);
}

export { NgonNguProvider, useNgonNgu };
