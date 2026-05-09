import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BotBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <Link to="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft size={20} />
        Вернуться в список
      </Link>
      <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Конструктор бота #{id}</h1>
        <p className="text-gray-500 mt-4 max-w-md mx-auto">
          Здесь мы будем строить дерево сценария, настраивать цвета и логику ответов. 
          Этот функционал будет реализован на следующем шаге.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold mb-2">Настройки</h3>
            <p className="text-sm text-gray-400">Цвета, имя и статус</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold mb-2">Сценарий</h3>
            <p className="text-sm text-gray-400">Узлы и цепочки сообщений</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold mb-2">Аналитика</h3>
            <p className="text-sm text-gray-400">Просмотр собранных лидов</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotBuilder;
