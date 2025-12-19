import { useState } from 'react';
import LoginForm from './components/LoginForm';
import api from '../../auth/services/api';
import { getCurrentUser } from '../../auth/services/userService';
import type { User } from '../../auth/types/user';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}


const Login = ({ onLoginSuccess }: LoginProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (usuNom: string, password: string) => {
    try {
      const response = await api.post('/user/token/', {
        usuNom,
        password,
      });

      const { access, refresh } = response.data;

      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      
      const userData = await getCurrentUser();
      onLoginSuccess(userData); //  Actualiza el estado del Router
      
    } catch (err: any) {
      setError('Usuario o contraseña incorrectos');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-96 border border-gray-300">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Iniciar Sesión
        </h1>
        <LoginForm onLogin={handleLogin} />
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Login;