import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Settings, Copy, Check, MessageSquare, Loader2, LogOut } from 'lucide-react';
import type { Bot } from '../types';

const Dashboard: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
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
      setIsLoading(true);
      const response = await api.get('/manage/');
      setBots(response.data);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
      setBots([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    
    try {
      const response = await api.post('/manage/', { name: newBotName });
      setBots([...bots, response.data]);
      setIsModalOpen(false);
      setNewBotName('');
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Ошибка при создании бота. Проверьте подключение к бэкенду.');
    }
  };

  const getScriptTag = (widgetId: string) => {
    return `<script
    id="saas-chat-script"
    data-widget-id="${widgetId}"
    src="dist/widget.js">
</script>`;
  };

  const copyToClipboard = (widgetId: string) => {
    const script = getScriptTag(widgetId);
    navigator.clipboard.writeText(script);
    setCopiedId(widgetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openScriptModal = (widgetId: string) => {
    setActiveWidgetId(widgetId);
    setIsScriptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Дашборд</h1>
            <p className="text-gray-500 mt-1">Управление вашими чат-ботами</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-3 rounded-xl font-semibold transition-all active:scale-95"
              title="Выйти"
            >
              <LogOut size={20} />
              Выйти
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus size={22} />
              Создать нового бота
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : bots.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-300 shadow-inner">
            <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="text-blue-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Список ботов пуст</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto text-lg">
              Создайте своего первого бота прямо сейчас, чтобы начать работу.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              Создать первого бота
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bots.map((bot) => (
              <div key={bot.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner"
                      style={{ backgroundColor: bot.theme_color || '#3b82f6' }}
                    >
                      <MessageSquare size={28} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        bot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {bot.is_active ? 'Активен' : 'Черновик'}
                      </span>
                      <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg text-blue-600">
                        <span className="text-sm font-bold">{bot.leads_count || 0}</span>
                        <span className="text-xs font-medium uppercase">Лидов</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{bot.name}</h3>
                  <p className="text-sm text-gray-400 mb-8 font-mono bg-gray-50 p-2 rounded-lg truncate">ID: {bot.widget_id}</p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate(`/dashboard/builder/${bot.id}`)}
                      className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      <Settings size={18} />
                      Редактировать
                    </button>
                    <button
                      onClick={() => openScriptModal(bot.widget_id)}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-blue-600 px-6 py-3 rounded-xl text-sm font-bold transition-all border-2 border-blue-50"
                    >
                      <Copy size={18} />
                      Код виджета
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-10 shadow-2xl">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Новый бот</h2>
            <p className="text-gray-500 mb-8">Придумайте название для вашего ассистента.</p>
            <form onSubmit={handleCreateBot}>
              <div className="mb-8">
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-lg font-medium"
                  placeholder="Название (напр. Sales Bot)"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScriptModalOpen && activeWidgetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full p-10 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Код виджета</h2>
                <p className="text-gray-500">Скопируйте этот код и вставьте его перед закрывающим тегом <code>&lt;/body&gt;</code> на вашем сайте.</p>
              </div>
              <button 
                onClick={() => setIsScriptModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus size={24} className="rotate-45 text-gray-400" />
              </button>
            </div>
            
            <div className="relative group">
              <pre className="bg-gray-900 text-blue-400 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed border-4 border-gray-800 shadow-inner">
                {getScriptTag(activeWidgetId)}
              </pre>
              <button
                onClick={() => copyToClipboard(activeWidgetId)}
                className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                {copiedId === activeWidgetId ? (
                  <>
                    <Check size={14} />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Копировать
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setIsScriptModalOpen(false)}
              className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
