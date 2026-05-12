import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Plus, 
  Settings, 
  Copy, 
  Check, 
  MessageSquare, 
  Loader2, 
  LogOut, 
  Trash2, 
  Edit2, 
  X,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Zap
} from 'lucide-react';
import type { Bot, User } from '../types';

const Dashboard: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchBots = async () => {
    try {
      const response = await api.get('/manage/');
      setBots(response.data);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
      setBots([]);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/me/');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchBots(), fetchUser()]);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    
    try {
      const response = await api.post('/manage/', { name: newBotName });
      setBots([...bots, response.data]);
      setIsModalOpen(false);
      setNewBotName('');
      // Redirect to builder immediately for intuitive flow
      navigate(`/dashboard/builder/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Ошибка при создании бота.');
    }
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await api.patch(`/manage/${id}/`, { name: editName });
      setBots(bots.map(b => b.id === id ? { ...b, name: editName } : b));
      setEditingId(null);
    } catch (error) {
      alert('Ошибка при переименовании');
    }
  };

  const handleDeleteBot = async (id: number) => {
    if (!window.confirm('Удалить этого бота и все его данные?')) return;
    try {
      await api.delete(`/manage/${id}/`);
      setBots(bots.filter(b => b.id !== id));
    } catch (error: any) {
      alert('Ошибка при удалении');
    }
  };

  const getScriptTag = (widgetId: string) => {
    return `<script
    type="module"
    id="saas-chat-script"
    data-widget-id="${widgetId}"
    src="/src/main.tsx">
</script>`;
  };

  const copyToClipboard = (widgetId: string) => {
    const script = getScriptTag(widgetId);
    navigator.clipboard.writeText(script);
    setCopiedId(widgetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
               <MessageSquare className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Мои Боты</h1>
              <div className="flex items-center gap-2 mt-1">
                {user && (
                  <>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <UserIcon size={14} /> {user.username}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${user.tier === 'premium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {user.tier === 'premium' && <Zap size={10} fill="currentColor" />}
                      {user.tier}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 active:scale-95"
            >
              <Plus size={24} />
              Создать бота
            </button>
            <button
              onClick={handleLogout}
              className="p-4 bg-white hover:bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 transition-all active:scale-95"
              title="Выйти"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
        ) : bots.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
            <div className="bg-indigo-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <MessageSquare className="text-indigo-600" size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Начните прямо сейчас</h3>
            <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
              Создайте своего первого бота, чтобы автоматизировать общение с клиентами.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200"
            >
              Создать первого бота
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div key={bot.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden flex flex-col">
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-inner transform group-hover:rotate-6 transition-transform"
                      style={{ backgroundColor: bot.theme_color || '#4f46e5' }}
                    >
                      <MessageSquare size={32} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                         {bot.is_active ? 'Online' : 'Draft'}
                       </span>
                       <div className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">
                         {bot.leads_count || 0} Leads
                       </div>
                    </div>
                  </div>

                  {editingId === bot.id ? (
                    <div className="flex gap-2 mb-4">
                      <input 
                        autoFocus
                        className="flex-1 px-4 py-2 bg-slate-50 border-2 border-indigo-500 rounded-xl text-lg font-bold outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(bot.id)}
                      />
                      <button onClick={() => handleRename(bot.id)} className="p-2 bg-indigo-600 text-white rounded-xl"><Check size={20}/></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-400 rounded-xl"><X size={20}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-4 group/name">
                      <h3 className="text-2xl font-black text-slate-900 group-hover/name:text-indigo-600 transition-colors">{bot.name}</h3>
                      <button 
                        onClick={() => { setEditingId(bot.id); setEditName(bot.name); }}
                        className="p-1.5 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-50/50 rounded-2xl p-4 mb-4">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ID Виджета</p>
                     <div className="font-mono text-[10px] text-slate-500 truncate">
                        {bot.widget_id}
                     </div>
                  </div>
                </div>

                <div className="px-8 pb-8 space-y-3 mt-auto">
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/dashboard/builder/${bot.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95"
                    >
                      <Settings size={18} />
                      Конструктор
                    </button>
                    <button
                      onClick={() => { setActiveWidgetId(bot.widget_id); setIsScriptModalOpen(true); }}
                      className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl transition-all active:scale-95"
                      title="Получить код"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl text-[11px] font-bold transition-all"
                  >
                    <Trash2 size={16} />
                    Удалить бота
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Bot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">Новый бот</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleCreateBot}>
              <div className="mb-10">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Как назовём?</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-xl font-bold"
                  placeholder="Sales Assistant"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  Создать и начать настройку
                  <ChevronRight size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Script Modal */}
      {isScriptModalOpen && activeWidgetId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] max-w-2xl w-full p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Установка виджета</h2>
                <p className="text-slate-500 font-medium">Вставьте этот код на ваш сайт перед тегом <code>&lt;/body&gt;</code></p>
              </div>
              <button 
                onClick={() => setIsScriptModalOpen(false)}
                className="p-2 text-slate-300 hover:text-slate-500"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="relative mb-8">
              <pre className="bg-slate-900 text-indigo-300 p-8 rounded-3xl overflow-x-auto font-mono text-xs leading-relaxed border-8 border-slate-800 shadow-inner">
                {getScriptTag(activeWidgetId)}
              </pre>
              <button
                onClick={() => copyToClipboard(activeWidgetId)}
                className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xl"
              >
                {copiedId === activeWidgetId ? <Check size={16} /> : <Copy size={16} />}
                {copiedId === activeWidgetId ? 'Скопировано!' : 'Копировать код'}
              </button>
            </div>

            <div className="flex">
               <button
                onClick={() => setIsScriptModalOpen(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
