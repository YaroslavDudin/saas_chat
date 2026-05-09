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
  Loader2 
} from 'lucide-react';
import type { ScenarioNode } from '../types';

const STEP_TYPES = [
  { value: 'message', label: 'Сообщение', icon: MessageSquare },
  { value: 'question', label: 'Вопрос', icon: Type },
  { value: 'finish', label: 'Завершение', icon: CheckSquare },
];

const Builder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/manage/${id}/`);
        setNodes(response.data.nodes || []);
      } catch (error) {
        console.error('Ошибка при загрузке сценария:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodes();
  }, [id]);

  const addStep = () => {
    const newNode: ScenarioNode = {
      step_type: 'message',
      content: ''
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

  const saveScenario = async () => {
    try {
      setIsSaving(true);
      const payload = nodes.map(({ step_type, content }) => ({ step_type, content }));
      await api.post(`/manage/${id}/save-nodes/`, payload);
      alert('Сценарий успешно сохранен!');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить сценарий');
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Конструктор сценария</h1>
          </div>
          <button
            onClick={saveScenario}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Сохранить
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <div className="space-y-6 relative">
          {nodes.length > 1 && (
            <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gray-200 -z-0" />
          )}

          {nodes.map((node, index) => (
            <div key={index} className="relative flex gap-6 items-start z-10">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white border-2 border-blue-100 shadow-sm flex items-center justify-center text-blue-600 font-bold text-lg">
                {index + 1}
              </div>
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-blue-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {STEP_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => updateNode(index, { step_type: type.value })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            node.step_type === type.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <textarea
                    className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
                    placeholder="Введите текст сообщения или вопрос бота..."
                    value={node.content}
                    onChange={(e) => updateNode(index, { content: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-4">
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-8 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all w-full justify-center"
            >
              <Plus size={20} />
              Добавить новый шаг
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
