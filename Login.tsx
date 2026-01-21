import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { STATIONS, APP_CONFIG } from '../constants';
import { Car, Loader2, UserPlus, LogIn, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, organization: string) => void; // 增加 organization 參數
  onForgotPassword: (email: string) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onForgotPassword, users }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState(''); // 新增：任職單位狀態
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. 處理登入：改為正式 API 呼叫
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'checkUserAuth',
          userEmail: email.trim(),
          password: password
        })
      });

      const result = await response.json();

      if (result.success) {
        // 登入成功，將後端回傳的完整 User 物件傳回 App.tsx
        onLogin(result.user);
      } else {
        // 登入失敗，顯示後端回傳的具體原因
        setErrorMsg(result.msg || '登入失敗，請檢查帳號密碼。');
      }
    } catch (err) {
      setErrorMsg('連線失敗，請檢查網路或 API 設定。');
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 處理註冊：包含組織單位
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    // 先在前端做基礎檢查
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setErrorMsg('此 Email 已被註冊。');
      setIsLoading(false);
      return;
    }

    // 模擬網路延遲後送出申請
    setTimeout(() => {
      onRegister(name, email, organization);
      setSuccessMsg('申請已送出！管理員核准後會寄發初始密碼。');
      setMode('LOGIN');
      setIsLoading(false);
      // 清空註冊資料
      setName('');
      setOrganization('');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
            <Car className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">基隆市停車場履約管理</h1>
          <p className="text-gray-500 mt-2">
            {mode === 'LOGIN' ? '請輸入帳號密碼登入' : '申請進入系統'}
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

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">密碼</label>
                <button 
                  type="button"
                  onClick={() => onForgotPassword(email)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  忘記密碼？
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">任職單位 (Organization)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：XX停車場公司"
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
