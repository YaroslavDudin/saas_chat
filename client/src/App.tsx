import React, { useState, useEffect, useRef } from 'react';
import type { BotConfig, Message, ScenarioNode } from './types';
import './App.css';

interface AppProps {
  widgetId: string;
}

const API_BASE = 'http://localhost:8000/api';

const App: React.FC<AppProps> = ({ widgetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNode, setCurrentNode] = useState<ScenarioNode | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  
  // Генерируем или извлекаем visitorId
  const visitorId = useRef<string>(
    localStorage.getItem('saas_chat_visitor_id') || 
    `vis_${Math.random().toString(36).substr(2, 9)}`
  ).current;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('saas_chat_visitor_id', visitorId);
    fetchBotConfig();
  }, [widgetId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchBotConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/init/${widgetId}/`);
      const data: BotConfig = await response.json();
      setBotConfig(data);
      
      if (data.first_node) {
        addBotMessage(data.first_node);
      }
    } catch (error) {
      console.error('Failed to init bot:', error);
    }
  };

  const addBotMessage = (node: ScenarioNode) => {
    const newMessage: Message = {
      id: Math.random().toString(),
      text: node.content,
      isBot: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setCurrentNode(node);
  };

  const handleResponse = async (userText: string, nodeId: number) => {
    // Добавляем сообщение пользователя
    const userMsg: Message = {
      id: Math.random().toString(),
      text: userText,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    try {
      const response = await fetch(`${API_BASE}/respond/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widget_id: widgetId,
          visitor_id: visitorId,
          current_node_id: nodeId,
          value: userText
        })
      });
      
      const data = await response.json();
      
      if (data.id) {
        addBotMessage(data);
      } else if (data.message) {
        // Конец сценария
        setMessages(prev => [...prev, {
          id: 'end',
          text: data.message,
          isBot: true,
          timestamp: new Date()
        }]);
        setCurrentNode(null);
      }
    } catch (error) {
      console.error('Failed to send response:', error);
    }
  };

  const themeStyle = {
    backgroundColor: botConfig?.theme_color || '#000000'
  };

  return (
    <div className="saas-widget-wrapper">
      <div className="saas-chat-container">
      {/* Кнопка открытия */}
      <div 
        className="saas-chat-button" 
        style={themeStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>

      {/* Окно чата */}
      {isOpen && (
        <div className="saas-chat-window">
          <div className="saas-chat-header" style={themeStyle}>
            {botConfig?.name || 'Загрузка...'}
          </div>
          
          <div className="saas-chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`saas-msg ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="saas-chat-footer">
            {currentNode?.step_type === 'button_choice' && (
              <button 
                className="saas-choice-btn"
                onClick={() => handleResponse('Далее', currentNode.id)}
              >
                Далее
              </button>
            )}
            
            {currentNode?.step_type === 'phone_collection' && (
              <div className="saas-input-area">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Введите номер телефона..."
                  onKeyPress={(e) => e.key === 'Enter' && handleResponse(inputValue, currentNode.id)}
                />
                <button onClick={() => handleResponse(inputValue, currentNode.id)}>Отправить</button>
              </div>
            )}
            
            {currentNode?.step_type === 'message' && (
               <button 
                className="saas-choice-btn"
                onClick={() => handleResponse('Ок', currentNode.id)}
               >
                 Ок
               </button>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default App;
