import React, { useState, useEffect } from 'react';
import { User, UserRole, StationCode } from '../types';
import { STATIONS } from '../constants';
import { Car, Loader2, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string) => void;
  users: User[]; // Pass current users to check against
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, users }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check if running in GAS environment on mount for auto-login
  useEffect(() => {
    if (window.google?.script?.run) {
      setIsLoading(true);
      window.google.script.run
        .withSuccessHandler((response: any) => {
          if (response.success) {
            onLogin({
              name: response.user.name,
              email: response.user.email,
              role: response.user.role as UserRole,
              assignedStation: response.user.station === '全部' ? 'ALL' : STATIONS.find(s => s.name === response.user.station)?.code || 'ALL',
              isActive: true
            });
          } else {
            setIsLoading(false); // Stay on login screen if auth fails
          }
        })
        .withFailureHandler((err: any) => {
          console.error(err);
          setIsLoading(false);
        })
        .checkUserAuth();
    }
  }, [onLogin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    // Simulate Network Delay
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        if (!user.isActive) {
           setErrorMsg('您的帳號已被停用，請聯繫管理員。');
        } else if (user.role === UserRole.PENDING) {
           setErrorMsg('您的帳號正在審核中，請稍候。');
        } else {
           onLogin(user);
        }
      } else {
        setErrorMsg('找不到此 Email，請先申請帳號。');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        setErrorMsg('此 Email 已被註冊。');
      } else {
        onRegister(name, email);
        setSuccessMsg('申請已送出！請等待管理員核准後並分配權限。');
        setMode('LOGIN'); // Switch back to login
      }
      setIsLoading(false);
    }, 800);
  };

  if (isLoading && window.google?.script?.run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-pulse">
           <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
           <p className="text-gray-600 font-bold">正在驗證身分...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
           <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
             <Car className="w-10 h-10 text-blue-600" />
           </div>
           <h1 className="text-2xl font-bold text-gray-800">基隆市停車場履約管理</h1>
           <p className="text-gray-500 mt-2">
             {mode === 'LOGIN' ? '請輸入權限表中的 Email 登入' : '申請進入系統'}
           </p>
        </div>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center">
             <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
             {successMsg}
          </div>
        )}

        {mode === 'LOGIN' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 (Email)</label>
              <input 
                type="email" 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><LogIn className="w-4 h-4 mr-2" /> 登入系統</>}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-sm text-blue-600 hover:underline"
              >
                沒有帳號？申請存取權限
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱 (Name)</label>
              <input 
                type="text" 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="王小明"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 (Email)</label>
              <input 
                type="email" 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex justify-center items-center"
            >
               {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><UserPlus className="w-4 h-4 mr-2" /> 送出申請</>}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                返回登入
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;