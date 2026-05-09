import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import ProtectedRoute from './components/ProtectedRoute';

const Register = () => (
  <div className="flex items-center justify-center min-h-screen">
    <h1 className="text-xl text-gray-700">Страница регистрации (в разработке)</h1>
  </div>
);

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
        <Route path="builder/:id" element={<Builder />} />
      </Route>

      {/* Редирект с корня */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
