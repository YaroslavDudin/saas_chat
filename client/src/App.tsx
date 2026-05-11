import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ChevronRight } from 'lucide-react';
import type { BotConfig, Message, ScenarioNode } from './types';

interface AppProps {
  widgetId: string;
}

const getApiBase = () => {
  // 1. Поиск скрипта для определения базового URL
  const scriptTag = document.getElementById('saas-chat-script') as HTMLScriptElement 
    || document.querySelector('script[data-widget-id]') as HTMLScriptElement;
  
  if (scriptTag && scriptTag.src) {
    try {
      const url = new URL(scriptTag.src);
      
      // Если виджет загружен с сервера разработки Vite (5174), 
      // то API скорее всего находится на 8000 порту (Django)
      if (url.port === '5174') {
        return 'http://localhost:8000/api';
      }
      
      // В продакшене используем домен, с которого загружен скрипт
      return `${url.origin}/api`;
    } catch (e) {
      return '/api';
    }
  }
  return '/api';
};

const API_BASE = getApiBase();

const App: React.FC<AppProps> = ({ widgetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNode, setCurrentNode] = useState<ScenarioNode | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const visitorId = useRef<string>(
    localStorage.getItem('saas_chat_visitor_id') || 
    `vis_${Math.random().toString(36).substring(2, 11)}`
  ).current;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('saas_chat_visitor_id', visitorId);
    fetchBotConfig();
  }, [widgetId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, currentNode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchBotConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/init/${widgetId}/`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data: BotConfig = await response.json();
      setBotConfig(data);
      
      if (data.first_node && messages.length === 0) {
        setTimeout(() => addBotMessage(data.first_node!), 800);
      }
    } catch (error) {
      console.error('Failed to init twbot-', error);
    }
  };

  const addBotMessage = (node: ScenarioNode) => {
    setIsTyping(true);
    setCurrentNode(null); // Clear node while typing
    
    const delay = Math.min(Math.max(node.content.length * 15, 800), 2500);
    
    setTimeout(() => {
      const newMessage: Message = {
        id: `bot_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        text: node.content,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setCurrentNode(node);
      setIsTyping(false);
    }, delay);
  };

  const handleResponse = async (userText: string, nodeId: number | undefined) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      text: userText,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setCurrentNode(null);

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
      console.log('Widget received response:', data);
      
      if (data.id) {
        addBotMessage(data);
      } else if (data.message) {
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'end_msg',
            text: data.message,
            isBot: true,
            timestamp: new Date()
          }]);
          setIsTyping(false);
          setCurrentNode({ id: -1, step_type: 'message', content: 'END_CHAT', settings: {} });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send response:', error);
      setIsTyping(false);
    }
  };

  const themeStyle = {
    '--bot-color': botConfig?.theme_color || '#4f46e5',
  } as React.CSSProperties;

  return (
    <div className="twbot:fixed twbot:bottom-6 twbot:right-6 twbot:z-[99999] twbot:font-sans" style={themeStyle}>
      {/* Trigger Button */}
      <button 
        className={`twbot:w-16 twbot:h-16 twbot:rounded-[1.5rem] twbot:shadow-2xl twbot:flex twbot:items-center twbot:justify-center twbot:transition-all twbot:duration-500 twbot:ease-out hover:twbot:scale-105 active:twbot:scale-95 twbot:bg-bot-primary twbot:text-white transform ${isOpen ? 'twbot:rotate-90' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="twbot:w-8 twbot:h-8" />
        ) : (
          <MessageCircle className="twbot:w-8 twbot:h-8" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="twbot:absolute twbot:bottom-20 twbot:right-0 twbot:w-[400px] twbot:max-h-[640px] twbot:h-[calc(100vh-120px)] twbot:bg-white twbot:rounded-[2rem] twbot:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] twbot:flex twbot:flex-col twbot:overflow-hidden twbot:animate-fade-in-up twbot:border twbot:border-gray-100">
          {/* Header */}
          <div className="twbot:p-6 twbot:text-white twbot:bg-bot-primary twbot:flex twbot:items-center twbot:gap-4 twbot:shadow-lg">
            <div className="twbot:w-12 twbot:h-12 twbot:rounded-2xl twbot:bg-white/20 twbot:flex twbot:items-center twbot:justify-center twbot:backdrop-blur-md">
              <User className="twbot:w-7 twbot:h-7" />
            </div>
            <div className="twbot:flex-1">
              <div className="twbot:font-black twbot:text-lg twbot:leading-tight">{botConfig?.name || 'Бот-помощник'}</div>
              <div className="twbot:flex twbot:items-center twbot:gap-2 twbot:text-[10px] twbot:font-black twbot:uppercase twbot:tracking-widest twbot:opacity-70 twbot:mt-1">
                <span className="twbot:w-2 twbot:h-2 twbot:bg-green-400 twbot:rounded-full twbot:animate-pulse" />
                Онлайн
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="twbot:p-2 twbot:rounded-xl hover:twbot:bg-black/10 twbot:transition-colors"
            >
              <X className="twbot:w-6 twbot:h-6" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="twbot:flex-1 twbot:overflow-y-auto twbot:p-6 twbot:space-y-6 twbot:bg-white twbot:custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`twbot:flex ${msg.isBot ? 'twbot:justify-start' : 'twbot:justify-end'} twbot:animate-fade-in`}>
                <div 
                  className={`twbot:max-w-[85%] twbot:p-4 twbot:rounded-[1.5rem] twbot:text-[13px] twbot:leading-relaxed ${
                    msg.isBot 
                      ? 'twbot:bg-gray-100 twbot:text-gray-800 twbot:rounded-tl-none' 
                      : 'twbot:bg-bot-primary twbot:text-white twbot:rounded-tr-none'
                  }`}
                >
                  {msg.text}
                  <div className={`twbot:text-[9px] twbot:mt-2 twbot:font-bold twbot:uppercase twbot:tracking-tighter twbot:opacity-40 ${msg.isBot ? 'twbot:text-left' : 'twbot:text-right'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="twbot:flex twbot:justify-start">
                <div className="twbot:bg-gray-100 twbot:p-4 twbot:rounded-2xl twbot:rounded-tl-none">
                  <div className="twbot:flex twbot:gap-1.5">
                    <span className="twbot:w-2 twbot:h-2 twbot:bg-gray-300 twbot:rounded-full twbot:animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="twbot:w-2 twbot:h-2 twbot:bg-gray-300 twbot:rounded-full twbot:animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="twbot:w-2 twbot:h-2 twbot:bg-gray-300 twbot:rounded-full twbot:animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Area */}
          <div className="twbot:p-6 twbot:bg-white twbot:border-t twbot:border-gray-50">
            {/* Input logic based on current node */}
            {currentNode && (
              <div className="twbot:animate-fade-in">
                {/* BUTTONS */}
                {currentNode.step_type === 'button_choice' && (
                  <div className="twbot:flex twbot:flex-wrap twbot:gap-2 twbot:mb-4">
                    {(currentNode.settings?.buttons || ['Далее']).map((btn, idx) => (
                      <button 
                        key={idx}
                        className="twbot:px-5 twbot:py-3 twbot:rounded-2xl twbot:border-2 twbot:border-bot-primary twbot:text-bot-primary twbot:text-xs twbot:font-black twbot:uppercase twbot:tracking-widest hover:twbot:bg-bot-primary hover:twbot:text-white twbot:transition-all active:twbot:scale-95"
                        onClick={() => handleResponse(btn, currentNode.id)}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* INPUT FIELD (Question/Form) */}
                {(currentNode.step_type === 'question' || currentNode.step_type === 'form') && (
                  <div className="twbot:relative twbot:flex twbot:items-center twbot:gap-3">
                    <div className="twbot:flex-1 twbot:relative">
                      <input 
                        type="text" 
                        autoFocus
                        className="twbot:w-full twbot:pr-12 twbot:pl-5 twbot:py-4 twbot:bg-gray-50 twbot:border-2 twbot:border-transparent focus:twbot:border-bot-primary/20 twbot:rounded-2xl twbot:text-sm focus:twbot:bg-white twbot:outline-none twbot:transition-all twbot:font-medium"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentNode.settings?.placeholder || "Ваш ответ..."}
                        onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleResponse(inputValue, currentNode.id)}
                      />
                      <button 
                        className={`twbot:absolute twbot:right-2 twbot:top-1/2 twbot:--translate-y-1/2 twbot:p-2.5 twbot:rounded-xl twbot:transition-all ${inputValue.trim() ? 'twbot:bg-bot-primary twbot:text-white twbot:shadow-lg' : 'twbot:text-gray-300'}`}
                        onClick={() => inputValue.trim() && handleResponse(inputValue, currentNode.id)}
                        disabled={!inputValue.trim()}
                      >
                        <Send className="twbot:w-5 twbot:h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* NEXT BUTTON (Message) */}
                {currentNode.step_type === 'message' && currentNode.content !== 'END_CHAT' && (
                  <button 
                    className="twbot:w-full twbot:py-4 twbot:bg-bot-primary twbot:text-white twbot:rounded-2xl twbot:text-xs twbot:font-black twbot:uppercase twbot:tracking-widest hover:twbot:opacity-90 twbot:transition-all twbot:flex twbot:items-center twbot:justify-center twbot:gap-3 shadow-xl shadow-bot-primary/20"
                    onClick={() => handleResponse('Далее', currentNode.id)}
                  >
                    Продолжить
                    <ChevronRight className="twbot:w-5 twbot:h-5" />
                  </button>
                )}
              </div>
            )}

            {!currentNode && !isTyping && messages.length > 0 && (
               <div className="twbot:text-center twbot:text-[10px] twbot:font-bold twbot:text-slate-300 twbot:uppercase twbot:tracking-widest twbot:py-1">
                 Ожидание...
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;