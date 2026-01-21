import React, { useState, useEffect } from 'react';
import { User, Task, AuditLog, StationCode, TaskStatus, LogAction, UserRole } from './types';
import { INITIAL_TASKS, STATIONS, getStationCodeByName, APP_CONFIG } from './constants';
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
  
  // App State
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);

  // 1. 自動從 Google Sheet 抓取使用者名單
  useEffect(() => {
    const fetchUsers = async () => {
      // 若 URL 未設定，則跳過
      if (!APP_CONFIG.SCRIPT_URL || APP_CONFIG.SCRIPT_URL.includes('YOUR_GAS_URL')) {
        console.warn("⚠️ 請在 constants.ts 設定正確的 GAS 部署網址 (SCRIPT_URL)");
        return;
      }

      try {
        console.log("正在從後端獲取用戶名單...");
        const response = await fetch(`${APP_CONFIG.SCRIPT_URL}?action=getUsers&t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          setUsers(data);
          console.log("✅ 用戶名單獲取成功", data.length, "筆");
        } else {
          console.warn("⚠️ 用戶名單格式不正確:", data);
        }
      } catch (err) {
        // 這裡只顯示警告，不讓 App 崩潰
        console.error("❌ 無法獲取用戶名單 (可能是網路問題或 CORS 設定):", err);
      }
    };
    fetchUsers();
  }, []);

  // 1.5 檢查是否需要強制修改密碼
  useEffect(() => {
    if (currentUser?.forceChangePassword) {
      setIsChangePwdOpen(true);
    }
  }, [currentUser]);

  // 2. 獲取工項資料
  const fetchTasks = async (stationName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${APP_CONFIG.SCRIPT_URL}?action=getTasks&station=${encodeURIComponent(stationName)}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      
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
      console.error("Failed to fetch tasks via API", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 紀錄日誌
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
    } catch (err) {
      console.warn("Log sync failed", err);
    }
  };

  // 處理註冊 (無需密碼，新增任職單位)
  const handleRegisterUser = async (name: string, email: string, organization: string) => {
    try {
      const response = await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'registerUser',
          user: { name, email, organization } 
        })
      });
      // 由於 CORS 問題，有時回應會是不透明的 (opaque)，這裡做簡單處理
      // 但若是正確設定 JSONP 或 CORS，應可解析
      try {
        const res = await response.json();
        if (res.success) {
          alert("申請已送出！管理員核准後，系統將發送預設密碼至您的信箱。");
          writeLog(LogAction.REGISTER, `新用戶申請: ${name} (${email}) - ${organization}`);
        } else {
          // 如果後端明確回傳失敗
          alert("申請失敗: " + (res.msg || "未知錯誤"));
        }
      } catch (e) {
        // 若無法解析 JSON (例如 no-cors 模式)，假設成功
        alert("申請已送出！管理員核准後，系統將發送預設密碼至您的信箱。");
        writeLog(LogAction.REGISTER, `新用戶申請: ${name} (${email}) - ${organization}`);
      }
    } catch (err) {
      alert("申請送出失敗，請檢查網路。");
    }
  };

  // 處理忘記密碼
  const handleForgotPassword = async (email: string) => {
    try {
       await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'resetPasswordRequest',
          email: email
        })
       });
       writeLog(LogAction.RESET_PASSWORD, `用戶請求重設密碼: ${email}`);
    } catch(err) {
       console.error(err);
    }
  };

  // 處理修改密碼 (Modal)
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
        alert("密碼修改成功！");
        setCurrentUser(prev => prev ? { ...prev, forceChangePassword: false } : null);
        setIsChangePwdOpen(false);
        writeLog(LogAction.CHANGE_PASSWORD, `用戶修改密碼成功`);
        return true;
      } else {
        alert("修改失敗: " + res.msg);
        return false;
      }
    } catch (err) {
      alert("網路錯誤或後端未回應");
      return false;
    }
  };

  // 處理其他一般功能...
  const handleCreateTask = async (formData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'createNewTask',
          ...formData
        })
      });
      const res = await response.json();
      
      if (res.success) {
        const stationFilter = currentUser?.assignedStation === 'ALL' ? '全部' : STATIONS.find(s => s.code === currentUser?.assignedStation)?.name || '全部';
        await fetchTasks(stationFilter);
        writeLog(LogAction.CREATE_TASK, `發佈工項: ${formData.itemName}`);
      } else {
        alert('建立失敗: ' + res.msg);
      }
    } catch (err) {
      console.error("Create task error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, newStatus: TaskStatus, attachmentUrl: string) => {
    setIsLoading(true);
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateTaskStatus',
          taskId,
          newStatus,
          attachmentUrl
        })
      });
      const stationFilter = currentUser?.assignedStation === 'ALL' ? '全部' : STATIONS.find(s => s.code === currentUser?.assignedStation)?.name || '全部';
      await fetchTasks(stationFilter);
      writeLog(LogAction.UPDATE_STATUS, `狀態更新為: ${newStatus}`, taskId);
    } catch (err) {
      console.error("Update task error", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin: Update User (Including Approvals which trigger email)
  const handleUpdateUser = async (email: string, updates: Partial<User>) => {
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateUser',
          email,
          updates
        })
      });
      
      // Update local state
      setUsers(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u));
      
      const logAction = updates.role && updates.role !== UserRole.PENDING ? LogAction.APPROVE_USER : LogAction.UPDATE_STATUS;
      writeLog(logAction, `更新使用者: ${email}`);

    } catch (err) {
      alert("更新失敗");
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      await fetch(APP_CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteUser',
          email
        })
      });
      setUsers(prev => prev.filter(u => u.email !== email));
      writeLog(LogAction.DELETE_TASK, `刪除使用者: ${email}`);
    } catch (err) {
      alert("刪除失敗");
    }
  };

  if (!currentUser) {
    return <Login 
      onLogin={(user) => {
        setCurrentUser(user);
        const stationFilter = user.assignedStation === 'ALL' ? '全部' : STATIONS.find(s => s.code === user.assignedStation)?.name || '全部';
        fetchTasks(stationFilter);
      }} 
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
            onViewHistory={handleViewHistory} 
        />
      )}
      {activeTab === 'calendar' && <CalendarView tasks={tasks} onEditTask={(task) => { setEditingTask(task); setIsEditModalOpen(true); }} />}
      {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && (
        <AdminPanel 
          users={users}
          logs={logs}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          currentUser={currentUser}
          tasks={tasks}
          onEditTask={() => {}}
          onCreateTask={() => {}}
          onViewHistory={handleViewHistory}
        />
      )}

      <EditTaskModal 
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateTask}
      />
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />
      
      {/* Change Password Modal (Forced or Voluntary) */}
      <ChangePasswordModal 
        isOpen={isChangePwdOpen}
        onClose={() => setIsChangePwdOpen(false)}
        onSubmit={handleChangePassword}
        isForced={currentUser.forceChangePassword || false}
      />
    </Layout>
  );

  function handleViewHistory(taskUid: string) {
    const history = logs.filter(l => l.taskUid === taskUid);
    const msg = history.map(h => `${new Date(h.timestamp).toLocaleString()} - ${h.action}: ${h.details}`).join('\n');
    alert(`歷史紀錄 (${taskUid}):\n` + (msg || '尚無紀錄'));
  };
};

export default App;