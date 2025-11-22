
import React, { useState } from 'react';
import { Heart, ArrowRight, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (password: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'HAPPYMONEY') {
      onLogin(password);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-peach-100 to-peach-300 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center transform transition-all">
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-peach-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <Heart className="text-white" size={40} fill="currentColor" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Familist</h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8">
          Enter the shared password to access your lists.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              className={`w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl outline-none text-lg text-center dark:text-white transition-all placeholder-gray-400 ${error ? 'border-red-400' : 'border-transparent focus:border-peach-400'}`}
              autoFocus
            />
            <Lock className="absolute left-4 top-5 text-gray-400" size={20} />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">Incorrect password</p>}

          <button
            type="submit"
            disabled={!password}
            className="w-full py-4 bg-gray-900 dark:bg-peach-500 text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
          >
            <span>Unlock Lists</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-peach-800 dark:text-gray-500 text-sm font-medium opacity-70">
        Shared • Secure • Simple
      </p>
    </div>
  );
};

export default LoginScreen;
