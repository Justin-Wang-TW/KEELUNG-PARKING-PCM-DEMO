import React, { useState, useEffect } from 'react';
import { User, UserRole, StationCode } from '../types';
import { STATIONS } from '../constants';
import { Car, Loader2, UserPlus, LogIn, AlertCircle, Lock, KeyRound, ArrowLeft, Eye, EyeOff, Mail, Building2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, organization: string) => void; // Updated signature
  onForgotPassword?: (email: string) => void;
  users: User[]; 
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onForgotPassword, users }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState(''); // New State
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
              isActive: true,
              password: response.user.password,
              forceChangePassword: response.user.forceChangePassword,
              organization: response.user.organization
            });
          } else {
            setIsLoading(false); 
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

    if (!password) {
      setErrorMsg('請輸入密碼');
      setIsLoading(false);
      return;
    }

    if (window.google?.script?.run) {
        window.google.script.run
            .withSuccessHandler((response: any) => {
                if (response.success) {
                    onLogin({
                        name: response.user.name,
                        email: response.user.email,
                        role: response.user.role as UserRole,
                        assignedStation: response.user.station === '全部' ? 'ALL' : STATIONS.find(s => s.name === response.user.station)?.code || 'ALL',
                        isActive: true,
                        forceChangePassword: response.user.forceChangePassword,
                        organization: response.user.organization
                    });
                } else {
                    setErrorMsg(response.msg || '登入失敗，請檢查帳號密碼');
                    setIsLoading(false);
                }
            })
            .withFailureHandler((err: any) => {
                setErrorMsg('系統連線錯誤');
                setIsLoading(false);
            })
            .loginUser(email, password); 
    } else {
        setTimeout(() => {
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user && user.password === password) {
                 if (!user.isActive) {
                    setErrorMsg('您的帳號已被停用。');
                 } else {
                    onLogin(user);
                 }
            } else {
                 setErrorMsg('本地測試模式：密碼錯誤或使用者不存在');
            }
            setIsLoading(false);
        }, 800);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!organization.trim()) {
      setErrorMsg('請填寫任職公司或機關名稱，以便管理員審核。');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        setErrorMsg('此 Email 已被註冊。');
      } else {
        onRegister(name, email, organization);
        setSuccessMsg('申請已送出！管理員審核通過後，系統將發送預設密碼至您的信箱。');
        setMode('LOGIN'); 
        setPassword('');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
       if (onForgotPassword) {
          onForgotPassword(email);
       }
       setSuccessMsg('重設請求已發送，系統將產生新密碼並寄送給您。');
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
             {mode === 'LOGIN' && '請輸入帳號密碼登入'}
             {mode === 'REGISTER' && '申請進入系統'}
             {mode === 'FORGOT' && '重設密碼'}
           </p>
        </div>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center text-left">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center text-left">
             <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
             <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {mode === 'LOGIN' && (
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-9 pr-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-1">
                <button 
                  type="button"
                  onClick={() => { setMode('FORGOT'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  忘記密碼？
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><LogIn className="w-4 h-4 mr-2" /> 登入系統</>}
            </button>
            
            <div className="text-center mt-4 pt-4 border-t">
              <button 
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(''); setSuccessMsg(''); setPassword(''); }}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium"
              >
                沒有帳號？申請存取權限
              </button>
            </div>
          </form>
        )}

        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
               <p className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>申請通過後，系統將自動發送<b>預設密碼</b>至您的電子信箱。</span>
               </p>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">任職公司 / 機關 (Organization)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：基隆市政府交通處、XX科技公司"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                />
              </div>
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
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> 返回登入
              </button>
            </div>
          </form>
        )}

        {mode === 'FORGOT' && (
           <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
             <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 border border-yellow-200 mb-4">
                請輸入您的註冊 Email，系統將重置您的密碼並寄送至信箱。
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
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex justify-center items-center"
            >
               {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '發送重設請求'}
            </button>

            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> 返回登入
              </button>
            </div>
           </form>
        )}
      </div>
    </div>
  );
};

export default Login;