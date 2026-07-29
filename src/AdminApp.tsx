import { useEffect, useState } from 'react';
import { UsuarioInterno } from './types';
import { getSesionAdmin } from './services/adminApiService';
import { AdminLoginScreen } from './components/admin/AdminLoginScreen';
import { AdminPosicionesScreen } from './components/admin/AdminPosicionesScreen';

export default function AdminApp() {
  const [usuario, setUsuario] = useState<UsuarioInterno | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    let active = true;
    getSesionAdmin().then((sesion) => {
      if (active) {
        setUsuario(sesion);
        setCargandoSesion(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleSesionExpirada = () => setUsuario(null);
    window.addEventListener('sesion-admin-expirada', handleSesionExpirada);
    return () => window.removeEventListener('sesion-admin-expirada', handleSesionExpirada);
  }, []);

  if (cargandoSesion) {
    return <div className="min-h-screen bg-paper" />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-terracotta selection:text-white">
      {usuario ? (
        <AdminPosicionesScreen usuario={usuario} onLogout={() => setUsuario(null)} />
      ) : (
        <AdminLoginScreen onLoginSuccess={setUsuario} />
      )}
    </div>
  );
}
