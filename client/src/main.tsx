import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const initWidget = () => {
  // Поиск скрипта по ID или атрибуту
  const scriptTag = document.getElementById('saas-chat-script') as HTMLScriptElement 
    || document.querySelector('script[data-widget-id]') as HTMLScriptElement;

  if (!scriptTag) {
    console.error('SaaS Chat: Script tag with id "saas-chat-script" or attribute "data-widget-id" not found.');
    return;
  }

  // Извлечение ID бота
  const widgetId = scriptTag.getAttribute('data-widget-id') 
    || new URL(scriptTag.src).searchParams.get('id');

  if (!widgetId) {
    console.error('SaaS Chat: Widget ID not found. Use data-widget-id or ?id= parameter.');
    return;
  }

  // Создание контейнера для React
  const rootContainer = document.createElement('div');
  rootContainer.id = 'saas-chat-widget-root';
  document.body.appendChild(rootContainer);

  // Рендер приложения
  ReactDOM.createRoot(rootContainer).render(
    <React.StrictMode>
      <App widgetId={widgetId} />
    </React.StrictMode>
  );
};

// Запуск инициализации
if (document.readyState === 'complete') {
  initWidget();
} else {
  window.addEventListener('load', initWidget);
}
