import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BotBuilder from './pages/BotBuilder';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Защищенные маршруты SaaS */}
      <Route path="/dashboard" element={<ProtectedRoute />}>
        {/* Список ботов */}
        <Route index element={<Dashboard />} />
        {/* Конструктор сценария */}
        <Route path="builder/:id" element={<BotBuilder />} />
      </Route>

      {/* Редирект с корня */}
      <Route path="/" element={<Navigate to="/register" replace />} />
    </Routes>
  );
};

export default App;
