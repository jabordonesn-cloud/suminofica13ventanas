import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, UserPlus, X, Store, Shield, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/auth';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('cajero');
  const [regError, setRegError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (result.success) {
      navigate('/inventario');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    const result = register(regUsername, regPassword, regRole);
    if (result.success) {
      navigate('/inventario');
    } else {
      setRegError(result.error || 'Error al registrar');
    }
  };

  const closeRegister = () => {
    setShowRegister(false);
    setRegError('');
    setRegUsername('');
    setRegPassword('');
    setRegRole('cajero');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gold accent shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold-100 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-100 rounded-full opacity-30 translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold-200/20 rounded-full" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-400 rounded-2xl shadow-gold mb-4">
            <Store className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">ERP & Punto de Venta</h1>
          <p className="text-gray-500 mt-2 text-sm">Sistema de gestión comercial</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Clave</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su clave"
                  className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gold-400 hover:bg-gold-500 text-white font-semibold py-3 rounded-lg transition-all shadow-gold-sm hover:shadow-gold"
            >
              Ingresar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowRegister(true)}
              className="w-full flex items-center justify-center gap-2 text-gold-500 hover:text-gold-600 font-medium text-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Crear Nuevo Usuario
            </button>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 bg-gold-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600">Credenciales de prueba:</p>
            <p>Admin: <span className="text-gold-500 font-medium">admin / admin123</span></p>
            <p>Cajero: <span className="text-gold-500 font-medium">cajero / cajero123</span></p>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={closeRegister}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gold-400 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Crear Nuevo Usuario</h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Nombre de Usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Mínimo 3 caracteres"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Clave</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 5 caracteres"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all
                      ${regRole === 'admin'
                        ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-400/30'
                        : 'border-gray-200 hover:border-gold-300'
                      }`}
                  >
                    <Shield className={`w-5 h-5 ${regRole === 'admin' ? 'text-gold-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Administrador</p>
                      <p className="text-xs text-gray-400">Acceso total</p>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={regRole === 'admin'}
                      onChange={() => setRegRole('admin')}
                      className="sr-only"
                    />
                  </label>
                  <label
                    className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all
                      ${regRole === 'cajero'
                        ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-400/30'
                        : 'border-gray-200 hover:border-gold-300'
                      }`}
                  >
                    <UserCircle className={`w-5 h-5 ${regRole === 'cajero' ? 'text-gold-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cajero</p>
                      <p className="text-xs text-gray-400">Acceso restringido</p>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      value="cajero"
                      checked={regRole === 'cajero'}
                      onChange={() => setRegRole('cajero')}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {regRole === 'admin'
                    ? 'Acceso a las 13 ventanas del sistema.'
                    : 'Sin acceso a Contabilidad, Pagos, Deuda ni Balance.'}
                </p>
              </div>

              {regError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gold-400 hover:bg-gold-500 text-white font-semibold py-3 rounded-lg transition-all shadow-gold-sm hover:shadow-gold"
              >
                Registrarse
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
