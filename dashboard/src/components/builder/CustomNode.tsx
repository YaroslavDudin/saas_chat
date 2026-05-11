import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, HelpCircle, List, FileText, Trash2 } from 'lucide-react';

const icons: Record<string, any> = {
  message: MessageSquare,
  question: HelpCircle,
  button_choice: List,
  form: FileText,
};

const labels: Record<string, string> = {
  message: 'Сообщение',
  question: 'Свободный ответ',
  button_choice: 'Выбор кнопок',
  form: 'Форма контакта',
};

const colors: Record<string, string> = {
  message: 'bg-blue-500',
  question: 'bg-amber-500',
  button_choice: 'bg-purple-500',
  form: 'bg-emerald-500',
};

const CustomNode = ({ data, id, selected }: any) => {
  const Icon = icons[data.step_type] || MessageSquare;
  const { onDelete } = data;

  return (
    <div className={`px-4 py-3 shadow-xl rounded-xl bg-white border-2 transition-all w-72 ${selected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100'}`}>
      {/* Target Handle (Input) */}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-400 border-2 border-white" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg text-white ${colors[data.step_type] || 'bg-gray-500'}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 leading-none mb-1">
            {labels[data.step_type]}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {data.content || 'Пустое сообщение...'}
          </h3>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="text-[11px] text-gray-500 italic border-t border-gray-50 pt-2 mb-2">
        {data.content || 'Нажмите, чтобы отредактировать'}
      </div>

      {/* Logic Handles (Output) */}
      {data.step_type === 'button_choice' ? (
        <div className="space-y-2 mt-2">
          {(data.settings?.buttons || ['Далее']).map((btn: string, idx: number) => (
            <div key={idx} className="relative flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
              <span className="text-[10px] font-medium text-gray-600 truncate mr-4">{btn}</span>
              <Handle 
                type="source" 
                position={Position.Right} 
                id={`handle-${btn}`} 
                className="!static !w-3 !h-3 !bg-purple-400 border-2 border-white !translate-x-4" 
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400 border-2 border-white" />
      )}
      
      {data.settings?.is_first && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
          Старт
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
