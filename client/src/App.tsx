import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MessageCircle, X, Send, User, ChevronRight, RefreshCw } from 'lucide-react';
import type { BotConfig, Message, ScenarioNode } from './types';

interface AppProps {
  widgetId: string;
}

const API_BASE = '/api';

/**
 * Custom hook to manage chat state and logic
 */
const useChatWidget = (widgetId: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNode, setCurrentNode] = useState<ScenarioNode | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialized = useRef(false);
  const visitorId = useMemo(() => {
    const saved = localStorage.getItem('saas_chat_visitor_id');
    if (saved) return saved;
    const newId = `vis_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('saas_chat_visitor_id', newId);
    return newId;
  }, []);

  const addBotMessage = useCallback((node: ScenarioNode) => {
    setIsTyping(true);
    setCurrentNode(null); 
    
    // Calculate realistic typing delay
    const delay = Math.min(Math.max(node.content.length * 15, 1000), 3000);
    
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
  }, []);

  const fetchBotConfig = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/init/${widgetId}/`);
      if (!response.ok) throw new Error('Failed to initialize widget');
      const data: BotConfig = await response.json();
      setBotConfig(data);
      
      if (data.first_node && messages.length === 0) {
        addBotMessage(data.first_node);
      }
    } catch (err) {
      console.error('SaaS Chat Error:', err);
      setError('Не удалось загрузить конфигурацию бота');
    }
  }, [widgetId, messages.length, addBotMessage]);

  useEffect(() => {
    if (!isInitialized.current) {
      fetchBotConfig();
      isInitialized.current = true;
    }
  }, [fetchBotConfig]);

  const sendMessage = useCallback(async (text: string, nodeId?: number) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      text: text,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setCurrentNode(null);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/respond/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widget_id: widgetId,
          visitor_id: visitorId,
          current_node_id: nodeId,
          value: text
        })
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      
      if (data.id) {
        addBotMessage(data);
      } else if (data.message) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'end_msg',
            text: data.message,
            isBot: true,
            timestamp: new Date()
          }]);
          setIsTyping(false);
        }, 1000);
      } else {
        setIsTyping(false);
      }
    } catch (err) {
      console.error('SaaS Chat Error:', err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        text: 'Извините, произошла ошибка. Попробуйте еще раз.',
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [widgetId, visitorId, addBotMessage]);

  const restartChat = useCallback(() => {
    setMessages([]);
    setCurrentNode(null);
    isInitialized.current = false;
    fetchBotConfig();
  }, [fetchBotConfig]);

  return {
    isOpen,
    setIsOpen,
    messages,
    currentNode,
    botConfig,
    isTyping,
    error,
    sendMessage,
    restartChat
  };
};

const App: React.FC<AppProps> = ({ widgetId }) => {
  const {
    isOpen,
    setIsOpen,
    messages,
    currentNode,
    botConfig,
    isTyping,
    error,
    sendMessage,
    restartChat
  } = useChatWidget(widgetId);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleAction = (text: string, nodeId?: number) => {
    sendMessage(text, nodeId);
    setInputValue('');
  };

  const themeStyle = {
    '--bot-color': botConfig?.theme_color || '#4f46e5',
  } as React.CSSProperties;

  return (
    <div className="twbot:fixed twbot:bottom-6 twbot:right-6 twbot:z-[99999] twbot:font-sans" style={themeStyle}>
      {/* FAB */}
      <button 
        className={`twbot:w-16 twbot:h-16 twbot:rounded-[1.8rem] twbot:shadow-2xl twbot:flex twbot:items-center twbot:justify-center twbot:transition-all twbot:duration-500 twbot:ease-in-out hover:twbot:scale-110 active:twbot:scale-95 twbot:bg-bot-primary twbot:text-white twbot:relative ${isOpen ? 'twbot:rotate-90' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Закрыть чат" : "Открыть чат"}
      >
        {isOpen ? <X className="twbot:w-8 twbot:h-8" /> : <MessageCircle className="twbot:w-8 twbot:h-8" />}
        {!isOpen && messages.length === 0 && (
          <span className="twbot:absolute twbot:-top-1 twbot:-right-1 twbot:w-4 twbot:h-4 twbot:bg-red-500 twbot:rounded-full twbot:animate-ping" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="twbot:absolute twbot:bottom-20 twbot:right-0 twbot:w-[420px] twbot:max-h-[700px] twbot:h-[calc(100vh-120px)] twbot:bg-white twbot:rounded-[2.5rem] twbot:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] twbot:flex twbot:flex-col twbot:overflow-hidden twbot:animate-fade-in-up twbot:border twbot:border-gray-100">
          
          {/* Header */}
          <div className="twbot:p-7 twbot:text-white twbot:bg-bot-primary twbot:flex twbot:items-center twbot:gap-4 twbot:relative twbot:overflow-hidden">
             {/* Decorative background element */}
            <div className="twbot:absolute twbot:-top-10 twbot:-right-10 twbot:w-40 twbot:h-40 twbot:bg-white/10 twbot:rounded-full twbot:blur-3xl" />
            
            <div className="twbot:w-14 twbot:h-14 twbot:rounded-2xl twbot:bg-white/20 twbot:flex twbot:items-center twbot:justify-center twbot:backdrop-blur-xl twbot:border twbot:border-white/20 twbot:shadow-inner">
              <User className="twbot:w-8 twbot:h-8" />
            </div>
            <div className="twbot:flex-1 twbot:z-10">
              <div className="twbot:font-black twbot:text-xl twbot:leading-none twbot:tracking-tight">{botConfig?.name || 'Ассистент'}</div>
              <div className="twbot:flex twbot:items-center twbot:gap-2 twbot:text-[11px] twbot:font-bold twbot:uppercase twbot:tracking-[0.2em] twbot:opacity-80 twbot:mt-2">
                <span className="twbot:w-2 twbot:h-2 twbot:bg-green-400 twbot:rounded-full twbot:shadow-[0_0_8px_#4ade80]" />
                Онлайн
              </div>
            </div>
            <div className="twbot:flex twbot:gap-2 twbot:z-10">
              <button 
                onClick={restartChat} 
                className="twbot:p-2.5 twbot:rounded-xl hover:twbot:bg-white/10 twbot:transition-all active:twbot:rotate-180 twbot:duration-500" 
                title="Начать заново"
              >
                <RefreshCw className="twbot:w-5 twbot:h-5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="twbot:p-2.5 twbot:rounded-xl hover:twbot:bg-white/10 twbot:transition-all">
                <X className="twbot:w-6 twbot:h-6" />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="twbot:flex-1 twbot:overflow-y-auto twbot:p-6 twbot:space-y-6 twbot:bg-slate-50/50 twbot:custom-scrollbar">
            {error && (
              <div className="twbot:p-4 twbot:bg-red-50 twbot:text-red-600 twbot:text-sm twbot:rounded-2xl twbot:text-center twbot:font-medium twbot:border twbot:border-red-100">
                {error}
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`twbot:flex ${msg.isBot ? 'twbot:justify-start' : 'twbot:justify-end'} twbot:animate-fade-in`}>
                <div 
                  className={`twbot:max-w-[85%] twbot:p-4 twbot:px-5 twbot:rounded-[1.8rem] twbot:text-[14px] twbot:leading-relaxed twbot:shadow-sm twbot:whitespace-pre-wrap ${
                    msg.isBot 
                      ? 'twbot:bg-white twbot:text-slate-800 twbot:rounded-tl-none twbot:border twbot:border-slate-100' 
                      : 'twbot:bg-bot-primary twbot:text-white twbot:rounded-tr-none'
                  }`}
                >
                  {msg.text}
                  <div className={`twbot:text-[10px] twbot:mt-2 twbot:font-bold twbot:opacity-40 ${msg.isBot ? 'twbot:text-left' : 'twbot:text-right'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="twbot:flex twbot:justify-start">
                <div className="twbot:bg-white twbot:p-4 twbot:px-6 twbot:rounded-[1.5rem] twbot:rounded-tl-none twbot:border twbot:border-slate-100 twbot:shadow-sm">
                  <div className="twbot:flex twbot:gap-1.5">
                    <span className="twbot:w-1.5 twbot:h-1.5 twbot:bg-slate-300 twbot:rounded-full twbot:animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="twbot:w-1.5 twbot:h-1.5 twbot:bg-slate-300 twbot:rounded-full twbot:animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="twbot:w-1.5 twbot:h-1.5 twbot:bg-slate-300 twbot:rounded-full twbot:animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interaction Area */}
          <div className="twbot:p-6 twbot:bg-white twbot:border-t twbot:border-slate-100">
            {currentNode && (
              <div className="twbot:animate-fade-in">
                {/* BUTTONS (Choices) */}
                {currentNode.step_type === 'button_choice' && (
                  <div className="twbot:flex twbot:flex-wrap twbot:gap-2 twbot:mb-2">
                    {(currentNode.settings?.buttons || ['Далее']).map((btn, idx) => (
                      <button 
                        key={idx}
                        className="twbot:px-6 twbot:py-3.5 twbot:rounded-2xl twbot:border-2 twbot:border-bot-primary/20 twbot:text-bot-primary twbot:text-xs twbot:font-black twbot:uppercase twbot:tracking-widest hover:twbot:bg-bot-primary hover:twbot:text-white hover:twbot:border-bot-primary twbot:transition-all active:twbot:scale-95 twbot:bg-slate-50/50"
                        onClick={() => handleAction(btn, currentNode.id)}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* INPUT (Question / Form) */}
                {(currentNode.step_type === 'question' || currentNode.step_type === 'form') && (
                  <div className="twbot:relative twbot:flex twbot:items-center twbot:gap-3">
                    <div className="twbot:flex-1 twbot:relative">
                      <input 
                        type="text" 
                        autoFocus
                        className="twbot:w-full twbot:pr-14 twbot:pl-6 twbot:py-4.5 twbot:bg-slate-50 twbot:border-2 twbot:border-transparent focus:twbot:border-bot-primary/20 twbot:rounded-[1.5rem] twbot:text-sm focus:twbot:bg-white twbot:outline-none twbot:transition-all twbot:font-medium twbot:placeholder:text-slate-400"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentNode.settings?.placeholder || "Введите ваш ответ..."}
                        onKeyPress={(e) => e.key === 'Enter' && handleAction(inputValue, currentNode.id)}
                      />
                      <button 
                        className={`twbot:absolute twbot:right-2 twbot:top-1/2 twbot:-translate-y-1/2 twbot:w-11 twbot:h-11 twbot:flex twbot:items-center twbot:justify-center twbot:rounded-xl twbot:transition-all ${inputValue.trim() ? 'twbot:bg-bot-primary twbot:text-white twbot:shadow-lg' : 'twbot:text-slate-300'}`}
                        onClick={() => handleAction(inputValue, currentNode.id)}
                        disabled={!inputValue.trim()}
                      >
                        <Send className="twbot:w-5 twbot:h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* CONTINUE BUTTON (Simple Message) */}
                {currentNode.step_type === 'message' && (
                  <button 
                    className="twbot:w-full twbot:py-5 twbot:bg-bot-primary twbot:text-white twbot:rounded-2xl twbot:text-xs twbot:font-black twbot:uppercase twbot:tracking-[0.2em] hover:twbot:opacity-95 twbot:transition-all twbot:flex twbot:items-center twbot:justify-center twbot:gap-3 twbot:shadow-[0_10px_25px_-5px_rgba(var(--bot-color-rgb),0.4)]"
                    onClick={() => handleAction(currentNode.settings?.buttons?.[0] || 'Продолжить', currentNode.id)}
                  >
                    {currentNode.settings?.buttons?.[0] || 'Далее'}
                    <ChevronRight className="twbot:w-5 twbot:h-5" />
                  </button>
                )}
              </div>
            )}

            {!currentNode && !isTyping && messages.length > 0 && (
               <div className="twbot:text-center twbot:py-2">
                 <div className="twbot:inline-flex twbot:items-center twbot:gap-2 twbot:px-4 twbot:py-1.5 twbot:bg-slate-100 twbot:rounded-full twbot:text-[10px] twbot:font-black twbot:text-slate-400 twbot:uppercase twbot:tracking-widest">
                   Диалог завершен
                 </div>
               </div>
            )}
            
            <div className="twbot:mt-4 twbot:text-center">
              <a href="#" className="twbot:text-[9px] twbot:font-bold twbot:text-slate-300 twbot:uppercase twbot:tracking-[0.15em] hover:twbot:text-bot-primary twbot:transition-colors">
                Powered by SaaS Chat
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
