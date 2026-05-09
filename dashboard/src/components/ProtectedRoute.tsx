import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Защитник маршрутов.
 * Проверяет наличие токена авторизации.
 */
const ProtectedRoute: React.FC = () => {
  // Для MVP проверяем токен в localStorage. 
  // В продакшене здесь была бы проверка валидности JWT или запрос к /me
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
