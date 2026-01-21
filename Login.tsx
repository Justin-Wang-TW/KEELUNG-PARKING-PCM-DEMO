import React, { useState, useEffect } from 'react';
import { User, UserRole, StationCode } from '../types';
import { STATIONS } from '../constants';
import { Car, Loader2, UserPlus, LogIn, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string) => void;
  onForgotPassword: (email: string) => void; // 新增：忘記密碼處理
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onForgotPassword, users }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // 新增：密碼狀態
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 新增：顯示密碼切換
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 自動登入邏輯 (維持原本 GAS 環境檢查)
  useEffect(() => {
    if (window.google?.script?.run) {
      setIsLoading(true);
      window.google.script.run
        .withSuccessHandler((response: any) => {
          if (response.success) {
            onLogin({
              ...response.user,
              assignedStation: response.user.station === '全部' ? 'ALL' : STATIONS.find(s => s.name === response.user.station)?.code || 'ALL',
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

    setTimeout(() => {
      // 1. 尋找使用者
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        setErrorMsg('找不到此 Email，請先申請帳號。');
        setIsLoading(false);
        return;
      }

      // 2. 帳號狀態檢查
      if (!user.isActive) {
        setErrorMsg('您的帳號已被停用，請聯繫管理員。');
        setIsLoading(false);
        return;
      }

      if (user.role === UserRole.PENDING) {
        setErrorMsg('您的帳號正在審核中，請稍候。');
        setIsLoading(false);
        return;
      }

      // 3. 密碼驗證 (假設後端傳來的 user.password 是雜湊值)
      // 注意：前端比對雜湊通常需要呼叫後端 API，這裡模擬驗證過程
      // 如果是在本地測試，建議增加一個欄位判斷
      if (user.password !== password) { 
        // 這裡如果是正式環境，應使用後端提供的 API 進行雜湊比對
        setErrorMsg('密碼錯誤，請重新輸入。');
        setIsLoading(false);
        return;
      }

      // 4. 判斷是否為初次登入 (需要強制修改密碼)
      if (user.needsPasswordChange) {
        // 你可以在這裡觸發一個特殊的狀態，或傳遞資訊給父組件
        // 為了簡單起見，我們將 user 傳回，由 App.tsx 判斷是否開啟修改密碼彈窗
        onLogin({ ...user, isFirstLoginAttempt: true });
      } else {
        onLogin(user);
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
        setSuccessMsg('申請已送出！管理員核准後會寄發預設密碼。');
        setMode('LOGIN');
      }
      setIsLoading(false);
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
            {/* Email 欄位 */}
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

            {/* 密碼欄位 - 新增 */}
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
          /* 註冊表單省略，維持與原本一致，或增加說明 */
          <form onSubmit={handleRegister} className="space-y-4">
             {/* ... 保持原本的註冊 Input 結構 ... */}
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
