import React, { useState, useEffect } from 'react';
import { User, Task, AuditLog, StationCode, TaskStatus, LogAction, UserRole } from './types';
import { STATIONS, getStationCodeByName, APP_CONFIG } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList'; 
import CalendarView from './components/CalendarView';
import AdminPanel from './components/AdminPanel';
import EditTaskModal from './components/EditTaskModal';
import CreateTaskModal from './components/CreateTaskModal';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);

  // 1. 初始化：獲取使用者名單 (用於註冊重複檢查等)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!APP_CONFIG.SCRIPT_URL || APP_CONFIG.SCRIPT_URL.includes('YOUR_GAS_URL')) return;
      try {
        const response = await fetch(`${APP_CONFIG.SCRIPT_URL}?action=getUsers&t=${Date.now()}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
          console.log("✅ 用戶名單獲取成功", data.length, "筆");
        }
      } catch (err) {
        console.error("❌ 無法獲取用戶名單:", err);
      }
    };
    fetchUsers();
  }, []);

  // 2. 監控 currentUser，一旦登入且有強制改密旗標，立即開啟 Modal
  useEffect(() => {
    if (currentUser && (currentUser.forceChangePassword === true || String(currentUser.forceChangePassword) === 'true')) {
      console.log("偵測到強制改密要求，開啟彈窗...");
      setIsChangePwdOpen(true);
    }
  }, [currentUser]);

  // 3. 獲取任務資料
  const fetchTasks = async (stationName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${APP_CONFIG.SCRIPT_URL}?action=getTasks&station=${encodeURIComponent(stationName)}&t=${Date.now()}`);
      const data = await response.json();
      if (data && data.success && data.tasks) {
        const mappedTasks: Task[] = data.tasks.map((row: any[]) => ({
          uid: row[0],
          stationName: row[1],
          stationCode: getStationCodeByName(row[1]),
          itemCode: row[2],
          itemName: row[3],
          deadline: row[4] ? new Date(row[4]).toISOString().split('T')[0] : '',
          status: row[5] as TaskStatus,
          executorEmail: row[6],
          lastUpdated: row[7],
          attachmentUrl: row[8]
        }));
        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 登入成功後的處理 (由 Login.tsx 調用)
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // 根據使用者權限過濾任務
    const stationFilter = user.assignedStation === 'ALL' ? '全部' : STATIONS.find(s => s.code === user.assignedStation)?.name || '全部';
    fetchTasks(stationFilter);
    // 寫入登入日誌
    writeLog(LogAction.LOGIN, `使用者登入成功`);
  };

  const writeLog = async (action: LogAction, detail: string, taskUid?: string) => {
    const email = currentUser?.email || 'SYSTEM';
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: email,
      action,
      details: detail,
      taskUid
    };
    setLogs(prev => [newLog, ...prev]);
    
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'writeLog',
          logData: { action, taskUid, detail, userEmail: email }
        })
      });
    } catch (err) { console.warn("Log sync failed", err); }
  };

  const handleRegisterUser = async (name: string, email: string, organization: string = '未提供') => {
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'registerUser',
          user: { name, email, organization } 
        })
      });
      alert("申請已送出！管理員核准後，系統將寄發預設密碼。");
      writeLog(LogAction.REGISTER, `新用戶申請: ${name} (${email}) - ${organization}`);
    } catch (err) {
      alert("申請送出失敗");
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) { alert("請輸入 Email"); return; }
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'resetPasswordRequest', email })
      });
      alert("重設密碼請求已送出，請注意信箱。");
    } catch(err) { alert("發送請求失敗"); }
  };

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const response = await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'changePassword',
          email: currentUser.email,
          newPassword: newPassword
        })
      });
      const res = await response.json();
      if (res.success) {
        alert("密碼修改成功！下次登入請使用新密碼。");
        setCurrentUser(prev => prev ? { ...prev, forceChangePassword: false } : null);
        setIsChangePwdOpen(false);
        writeLog(LogAction.CHANGE_PASSWORD, `用戶修改密碼成功`);
        return true;
      }
      return false;
    } catch (err) { 
      alert("修改密碼失敗，請稍後再試。");
      return false; 
    }
  };

  const handleUpdateTask = async (taskId: string, newStatus: TaskStatus, attachmentUrl: string) => {
    setIsLoading(true);
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateTaskStatus', taskId, newStatus, attachmentUrl })
      });
      const stationFilter = currentUser?.assignedStation === 'ALL' ? '全部' : STATIONS.find(s => s.code === currentUser?.assignedStation)?.name || '全部';
      await fetchTasks(stationFilter);
      writeLog(LogAction.UPDATE_STATUS, `狀態更新為: ${newStatus}`, taskId);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // 渲染邏輯
  if (!currentUser) {
    return <Login 
      onLogin={handleLoginSuccess} 
      onRegister={handleRegisterUser}
      onForgotPassword={handleForgotPassword}
      users={users} 
    />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser}
      onLogout={() => setCurrentUser(null)}
    >
      {activeTab === 'dashboard' && <Dashboard tasks={tasks} />}
      {activeTab === 'progress_report' && (
        <TaskList 
            tasks={tasks} 
            currentUser={currentUser} 
            onEditTask={(task) => { setEditingTask(task); setIsEditModalOpen(true); }} 
            onCreateTask={() => setIsCreateModalOpen(true)} 
            onViewHistory={(uid) => {
              const history = logs.filter(l => l.taskUid === uid);
              const msg = history.map(h => `${new Date(h.timestamp).toLocaleString()} - ${h.action}: ${h.details}`).join('\n');
              alert(`歷史紀錄 (${uid}):\n` + (msg || '尚無紀錄'));
            }} 
        />
      )}
      {activeTab === 'calendar' && <CalendarView tasks={tasks} onEditTask={(task) => { setEditingTask(task); setIsEditModalOpen(true); }} />}
      {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && (
        <AdminPanel 
          users={users}
          logs={logs}
          onUpdateUser={async (email, updates) => {
            await fetch(APP_CONFIG.SCRIPT_URL, {
              method: 'POST',
              body: JSON.stringify({ action: 'updateUser', email, updates })
            });
            setUsers(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u));
          }}
          onDeleteUser={async (email) => {
            await fetch(APP_CONFIG.SCRIPT_URL, {
              method: 'POST',
              body: JSON.stringify({ action: 'deleteUser', email })
            });
            setUsers(prev => prev.filter(u => u.email !== email));
          }}
          currentUser={currentUser}
          tasks={tasks}
          onEditTask={() => {}}
          onCreateTask={() => {}}
          onViewHistory={() => {}}
        />
      )}

      <EditTaskModal 
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateTask}
      />
      
      <ChangePasswordModal 
        isOpen={isChangePwdOpen}
        onClose={() => setIsChangePwdOpen(false)}
        onSubmit={handleChangePassword}
        isForced={currentUser.forceChangePassword || false}
      />
    </Layout>
  );
};

export default App;
