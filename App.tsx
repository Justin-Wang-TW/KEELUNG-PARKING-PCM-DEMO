import React, { useState, useEffect } from 'react';
import { User, Task, AuditLog, LogAction, UserRole } from './types';
import { STATIONS, APP_CONFIG, getStationCodeByName } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList'; 
import CalendarView from './components/CalendarView';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [users, setUsers] = useState<User[]>([]); 
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);

  // 1. 初始獲取用戶清單
  useEffect(() => {
    const fetchUsers = async () => {
      if (!APP_CONFIG.SCRIPT_URL) return;
      try {
        const response = await fetch(`${APP_CONFIG.SCRIPT_URL}?action=getUsers`);
        const data = await response.json();
        if (Array.isArray(data)) setUsers(data);
      } catch (err) { console.error("獲取用戶失敗", err); }
    };
    fetchUsers();
  }, []);

  // 2. 監控強制改密旗標
  useEffect(() => {
    // 考慮到 GAS 可能回傳布林值或字串，這裡做嚴格檢查
    if (currentUser && (currentUser.forceChangePassword === true || String(currentUser.forceChangePassword).toUpperCase() === 'TRUE')) {
      setIsChangePwdOpen(true);
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    const stationFilter = user.assignedStation === 'ALL' ? '全部' : STATIONS.find(s => s.code === user.assignedStation)?.name || '全部';
    fetchTasks(stationFilter);
  };

  const fetchTasks = async (stationName: string) => {
    try {
      const response = await fetch(`${APP_CONFIG.SCRIPT_URL}?action=getTasks&station=${encodeURIComponent(stationName)}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks.map((row: any[]) => ({
          uid: row[0], stationName: row[1], stationCode: getStationCodeByName(row[1]),
          itemCode: row[2], itemName: row[3], deadline: row[4], status: row[5],
          executorEmail: row[6], lastUpdated: row[7], attachmentUrl: row[8]
        })));
      }
    } catch (err) { console.error(err); }
  };

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const response = await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'changePassword', email: currentUser.email, newPassword })
      });
      const res = await response.json();
      if (res.success) {
        alert("密碼修改成功！");
        setCurrentUser(prev => prev ? { ...prev, forceChangePassword: false } : null);
        setIsChangePwdOpen(false);
        return true;
      }
      return false;
    } catch (err) { return false; }
  };

  if (!currentUser) {
    return <Login 
      onLogin={handleLogin} 
      onRegister={async (name, email, org) => {
        await fetch(APP_CONFIG.SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'registerUser', user: { name, email, organization: org } }) });
      }}
      onForgotPassword={async (email) => {
        await fetch(APP_CONFIG.SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'resetPasswordRequest', email }) });
        alert("重設請求已送出");
      }}
      users={users} 
    />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {activeTab === 'dashboard' && <Dashboard tasks={tasks} />}
      {activeTab === 'progress_report' && <TaskList tasks={tasks} currentUser={currentUser} onEditTask={()=>{}} onCreateTask={()=>{}} onViewHistory={()=>{}} />}
      {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && <AdminPanel users={users} logs={[]} onUpdateUser={()=>{}} onDeleteUser={()=>{}} currentUser={currentUser} tasks={tasks} onEditTask={()=>{}} onCreateTask={()=>{}} onViewHistory={()=>{}} />}
      
      <ChangePasswordModal 
        isOpen={isChangePwdOpen} 
        onClose={() => setIsChangePwdOpen(false)} 
        onSubmit={handleChangePassword} 
        isForced={true} 
      />
    </Layout>
  );
};

export default App;
