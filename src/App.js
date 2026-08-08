import { useEffect, useState } from 'react';
import TrangDangNhapDangKy from './pages/TrangDangNhapDangKy';
import TrangDashboard from './pages/TrangDashboard';
import { supabase } from './database/supabase';
import useCaiDat from './flows/useCaiDat';
import { NgonNguProvider } from './contexts/NgonNguContext';
import './styles/dang-nhap-dang-ky.css';

function App() {
  const { caiDat, capNhatGiaoDien, batTatThongBao } = useCaiDat();
  const [session, setSession] = useState(undefined);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      setSession(error ? null : data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setShowAuth(true);
      }
      if (event === 'SIGNED_IN') setShowAuth(false);
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setShowAuth(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  };

  let noiDung;

  if (isPasswordRecovery) {
    noiDung = (
      <TrangDangNhapDangKy
        initialMode="update-password"
        onPasswordUpdated={() => setIsPasswordRecovery(false)}
      />
    );
  } else if (showAuth && !session) {
    noiDung = <TrangDangNhapDangKy onBackToDashboard={() => setShowAuth(false)} />;
  } else {
    noiDung = (
      <TrangDashboard
        user={session?.user || null}
        onLogin={() => setShowAuth(true)}
        onSignOut={handleSignOut}
        caiDat={caiDat}
        onAppearanceChange={capNhatGiaoDien}
        onNotificationToggle={batTatThongBao}
      />
    );
  }

  return (
    <NgonNguProvider language={caiDat.language}>
      {noiDung}
    </NgonNguProvider>
  );
}

export default App;
