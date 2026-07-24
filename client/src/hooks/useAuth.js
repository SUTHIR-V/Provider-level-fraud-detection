import { useState } from 'react';
import api from '../api';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const providerId = localStorage.getItem('providerId');
    return token ? { token, role, providerId } : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    if (data.providerId) localStorage.setItem('providerId', data.providerId);
    setUser({ token: data.token, role: data.role, providerId: data.providerId });
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return { user, login, logout };
}
