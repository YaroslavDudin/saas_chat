import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  MessageSquare, 
  Type, 
  CheckSquare, 
  Loader2,
  List,
  Hash,
  Settings,
  X
} from 'lucide-react';
import type { ScenarioNode, Bot } from '../types';

const STEP_TYPES = [
  { value: 'message', label: 'Сообщение', icon: MessageSquare },
  { value: 'question', label: 'Вопрос', icon: Type },
  { value: 'button_choice', label: 'Кнопки', icon: List },
  { value: 'form', label: 'Форма', icon: CheckSquare },
];

const Builder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [bot, setBot] = useState<Bot | null>(null);
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchBotData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/manage/${id}/`);
        setBot(response.data);
        setNodes(response.data.nodes || []);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBotData();
  }, [id]);

  const addStep = () => {
    const newNode: ScenarioNode = {
      step_type: 'message',
      content: '',
      settings: { data_key: `field_${nodes.length + 1}` }
    };
    setNodes([...nodes, newNode]);
  };

  const removeStep = (index: number) => {
    setNodes(nodes.filter((_, i) => i !== index));
  };

  const updateNode = (index: number, updates: Partial<ScenarioNode>) => {
    const updatedNodes = [...nodes];
    updatedNodes[index] = { ...updatedNodes[index], ...updates };
    setNodes(updatedNodes);
  };

  const updateNodeSettings = (index: number, settingUpdates: any) => {
    const updatedNodes = [...nodes];
    updatedNodes[index] = { 
      ...updatedNodes[index], 
      settings: { ...updatedNodes[index].settings, ...settingUpdates } 
    };
    setNodes(updatedNodes);
  };

  const saveScenario = async () => {
    try {
      setIsSaving(true);
      
      // Save bot settings first
      if (bot) {
        await api.patch(`/manage/${id}/`, {
          name: bot.name,
          theme_color: bot.theme_color
        });
      }

      // Save nodes
      const payload = nodes.map(({ step_type, content, settings }) => ({ 
        step_type, 
        content, 
        settings: settings || {} 
      }));
      await api.post(`/manage/${id}/save-nodes/`, payload);
      
      alert('Все изменения успешно сохранены!');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{bot?.name}</h1>
              <p className="text-xs text-gray-400">ID: {bot?.widget_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
            >
              <Settings size={18} />
              Настройки
            </button>
            <button
              onClick={saveScenario}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Сохранить
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-10 px-4 flex gap-8">
        {/* Main Content (Nodes) */}
        <div className="flex-1">
          <div className="space-y-6 relative">
            {nodes.length > 1 && (
              <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gray-200 -z-0" />
            )}

            {nodes.map((node, index) => (
              <div key={index} className="relative flex gap-6 items-start z-10">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white border-2 border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {index + 1}
                </div>
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-indigo-300">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        {STEP_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => updateNode(index, { step_type: type.value })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              node.step_type === type.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <type.icon size={14} />
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Текст сообщения</label>
                        <textarea
                          className="w-full min-h-[80px] p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none"
                          placeholder="Что напишет бот?"
                          value={node.content}
                          onChange={(e) => updateNode(index, { content: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Ключ данных (ID)</label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                              type="text"
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              placeholder="например: email"
                              value={node.settings?.data_key || ''}
                              onChange={(e) => updateNodeSettings(index, { data_key: e.target.value })}
                            />
                          </div>
                        </div>

                        {node.step_type === 'button_choice' && (
                          <div>
                             <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Кнопки (через запятую)</label>
                             <div className="relative">
                               <List className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                               <input 
                                 type="text"
                                 className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                 placeholder="Да, Нет, Возможно"
                                 value={node.settings?.buttons?.join(', ') || ''}
                                 onChange={(e) => updateNodeSettings(index, { 
                                   buttons: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') 
                                 })}
                               />
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-8 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all w-full justify-center"
              >
                <Plus size={20} />
                Добавить новый шаг
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        {showSettings && (
          <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-6 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Settings size={20} className="text-indigo-600" />
                Настройки бота
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Название бота</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={bot?.name || ''}
                  onChange={(e) => setBot(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Цветовая схема</label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl border-2 border-white shadow-md cursor-pointer"
                    style={{ backgroundColor: bot?.theme_color || '#4f46e5' }}
                  />
                  <input 
                    type="color"
                    className="flex-1 h-10 w-full cursor-pointer rounded-lg overflow-hidden border-none"
                    value={bot?.theme_color || '#4f46e5'}
                    onChange={(e) => setBot(prev => prev ? { ...prev, theme_color: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl">
                <p className="text-[10px] text-indigo-600 font-bold uppercase mb-2">Предпросмотр темы</p>
                <div className="flex gap-2">
                  <div className="w-full h-8 rounded-md" style={{ backgroundColor: bot?.theme_color }} />
                  <div className="w-1/3 h-8 rounded-md opacity-50" style={{ backgroundColor: bot?.theme_color }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Builder;
