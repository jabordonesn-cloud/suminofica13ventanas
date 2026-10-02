import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Menu, X, Store, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navItems } from '@/config/navItems';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Cajero';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white border-r border-gold-200
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-400 rounded-lg flex items-center justify-center shadow-gold-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 leading-tight">ERP & Punto</h1>
              <p className="text-xs text-gold-500">de Venta</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gold-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center">
              <span className="text-gold-500 font-semibold text-sm uppercase">
                {user?.username.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{user?.username}</p>
              <span className="inline-block text-xs text-gold-400 font-medium">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${isActive
                    ? 'bg-gold-400 text-white shadow-gold-sm'
                    : 'text-gray-600 hover:bg-gold-50 hover:text-gold-500'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gold-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gold-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gold-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-sm font-semibold text-gray-700">ERP & Punto de Venta</span>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
