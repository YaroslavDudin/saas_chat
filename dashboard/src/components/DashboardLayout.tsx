import React from 'react';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Общий макет для защищенной части приложения.
 * Включает в себя навигацию и хедер.
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Боковая панель (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="font-bold text-xl tracking-tight text-gray-900">SaaS Chat</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-medium transition-colors"
          >
            <LayoutDashboard size={20} />
            Мои боты
          </Link>
          <button 
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 cursor-not-allowed rounded-xl font-medium"
          >
            <Settings size={20} />
            Настройки аккаунта
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all"
          >
            <LogOut size={20} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 md:hidden">
           <span className="font-bold text-lg text-gray-900">SaaS Chat</span>
           <button onClick={handleLogout} className="text-gray-500"><LogOut size={20} /></button>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
