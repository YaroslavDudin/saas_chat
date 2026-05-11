import React from 'react';
import { X, Save, Plus, Trash2, MessageSquare, HelpCircle, List, FileText } from 'lucide-react';

interface NodeEditorProps {
  node: any;
  onSave: (id: string, data: any) => void;
  onClose: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onSave, onClose }) => {
  const [formData, setFormData] = React.useState({
    content: node.data.content || '',
    settings: {
      buttons: node.data.settings?.buttons || [],
      placeholder: node.data.settings?.placeholder || '',
      data_key: node.data.settings?.data_key || '',
      ...node.data.settings
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const addButton = () => {
    const currentButtons = formData.settings.buttons || [];
    handleSettingsChange('buttons', [...currentButtons, `Кнопка ${currentButtons.length + 1}`]);
  };

  const removeButton = (index: number) => {
    const currentButtons = formData.settings.buttons || [];
    handleSettingsChange('buttons', currentButtons.filter((_: any, i: number) => i !== index));
  };

  const updateButtonText = (index: number, text: string) => {
    const currentButtons = [...(formData.settings.buttons || [])];
    currentButtons[index] = text;
    handleSettingsChange('buttons', currentButtons);
  };

  const nodeTypeInfo = {
    message: { label: 'Сообщение', icon: MessageSquare, color: 'text-blue-500' },
    question: { label: 'Вопрос', icon: HelpCircle, color: 'text-amber-500' },
    button_choice: { label: 'Кнопки', icon: List, color: 'text-purple-500' },
    form: { label: 'Форма', icon: FileText, color: 'text-emerald-500' },
  }[node.data.step_type as string] || { label: 'Узел', icon: MessageSquare, color: 'text-gray-500' };

  return (
    <div className="w-96 bg-white border-l border-gray-100 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm ${nodeTypeInfo.color}`}>
            <nodeTypeInfo.icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-none">{nodeTypeInfo.label}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">ID: {node.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Content Section */}
        <section>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Текст сообщения от бота
          </label>
          <textarea
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none min-h-[140px] resize-none transition-all"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Что напишет бот пользователю?"
          />
        </section>

        {/* Buttons Section */}
        {node.data.step_type === 'button_choice' && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Варианты ответов (кнопки)
              </label>
              <button 
                onClick={addButton}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Добавить
              </button>
            </div>
            
            <div className="space-y-3">
              {(formData.settings.buttons || []).map((btn: string, idx: number) => (
                <div key={idx} className="flex gap-2 group">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                      value={btn}
                      onChange={(e) => updateButtonText(idx, e.target.value)}
                      placeholder={`Кнопка ${idx + 1}`}
                    />
                  </div>
                  <button 
                    onClick={() => removeButton(idx)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {(!formData.settings.buttons || formData.settings.buttons.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-xs text-gray-400">Нажмите «Добавить», чтобы создать кнопки</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Question/Form Section */}
        {(node.data.step_type === 'question' || node.data.step_type === 'form') && (
          <section className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Настройки поля ввода
              </label>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-4">
                <div className="flex gap-3">
                  <HelpCircle size={18} className="text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    Этот блок заставит бота ждать текстового ответа от пользователя.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 ml-1">Подсказка в поле (Placeholder)</label>
                  <input
                    type="text"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                    value={formData.settings.placeholder || ''}
                    onChange={(e) => handleSettingsChange('placeholder', e.target.value)}
                    placeholder="Например: Введите вашу почту..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 ml-1">Ключ для сохранения (Data Key)</label>
                  <input
                    type="text"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                    value={formData.settings.data_key || ''}
                    onChange={(e) => handleSettingsChange('data_key', e.target.value)}
                    placeholder="email, name, phone..."
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="p-5 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => onSave(node.id, formData)}
          className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]"
        >
          <Save size={20} />
          Применить изменения
        </button>
      </div>
    </div>
  );
};

export default NodeEditor;
