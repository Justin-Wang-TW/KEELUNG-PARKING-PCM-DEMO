import React, { useState } from 'react';
import { User, AuditLog, UserRole, StationCode, Task } from '../types';
import { Shield, Users, FileText, Search, Activity, Lock, Unlock, Check, X, ListTodo, Building2, Trash2 } from 'lucide-react';
import { STATIONS } from '../constants';
import TaskList from './TaskList';

interface AdminPanelProps {
  users: User[];
  logs: AuditLog[];
  onUpdateUser: (email: string, updates: Partial<User>) => void;
  onDeleteUser: (email: string) => void;
  currentUser: User;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
  onViewHistory: (taskUid: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, 
  logs, 
  onUpdateUser,
  onDeleteUser,
  currentUser,
  tasks,
  onEditTask,
  onCreateTask,
  onViewHistory
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'users' | 'logs'>('tasks');
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>(UserRole.USER);
  const [approvalStation, setApprovalStation] = useState<StationCode | 'ALL'>(StationCode.BAIFU);

  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-white rounded-xl shadow-sm">
        <Shield className="w-16 h-16 mb-4 text-red-400" />
        <h2 className="text-xl font-bold text-gray-800">存取被拒</h2>
        <p>您沒有權限存取後台管理系統。</p>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.role === UserRole.PENDING);
  const activeUsers = users.filter(u => u.role !== UserRole.PENDING && (u.name.includes(userSearch) || u.email.includes(userSearch)));

  const filteredLogs = logs.filter(l => 
    l.userEmail.includes(logSearch) || l.details.includes(logSearch) || l.action.includes(logSearch)
  );

  const handleApproveSubmit = () => {
    if (approvingUser) {
      onUpdateUser(approvingUser.email, {
        role: approvalRole,
        assignedStation: approvalStation,
        isActive: true
      });
      setApprovingUser(null);
    }
  };

  const handleRejectUser = () => {
    if (approvingUser && window.confirm(`確定要否決並刪除 ${approvingUser.name} 的申請嗎？`)) {
      onDeleteUser(approvingUser.email);
      setApprovingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-purple-600" />
            後台管理系統
          </h2>
          <p className="text-gray-500 mt-1">
            系統中樞：任務派發、權限審核與日誌稽核
          </p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border shadow-sm mt-4 md:mt-0 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-all ${
              activeTab === 'tasks' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ListTodo className="w-4 h-4 mr-2" />
            任務列表
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-all ${
              activeTab === 'users' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            人員權限管理
            {pendingUsers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-all ${
              activeTab === 'logs' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            系統操作日誌
          </button>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-700">
                <strong>說明：</strong> 此處為全系統任務總表。您在此處新增或編輯的任務，將同步顯示於前端「進度匯報」頁面，供各停車場經理填報。
              </p>
           </div>
           <TaskList 
             tasks={tasks} 
             currentUser={currentUser} 
             onEditTask={onEditTask} 
             onCreateTask={onCreateTask} 
             onViewHistory={onViewHistory} 
           />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {pendingUsers.length > 0 && (
            <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 overflow-hidden">
              <div className="p-4 border-b border-orange-200 bg-orange-100 flex items-center justify-between">
                <div className="flex items-center">
                   <Shield className="w-5 h-5 mr-2 text-orange-600" />
                   <h3 className="font-bold text-orange-800">待審核申請 ({pendingUsers.length})</h3>
                </div>
              </div>
              <div className="p-4">
                 <table className="w-full text-left text-sm">
                   <thead className="text-xs text-orange-600 uppercase bg-orange-100/50 border-b border-orange-200">
                      <tr>
                         <th className="px-2 py-2">申請人</th>
                         <th className="px-2 py-2">任職單位</th>
                         <th className="px-2 py-2 text-right">操作</th>
                      </tr>
                   </thead>
                   <tbody>
                     {pendingUsers.map(user => (
                       <tr key={user.email} className="border-b border-orange-100 last:border-0 hover:bg-orange-50/50">
                         <td className="py-3 px-2 font-medium text-gray-800">
                            {user.name}
                            <span className="block text-xs text-gray-500 font-normal">{user.email}</span>
                         </td>
                         <td className="py-3 px-2">
                            {user.organization ? (
                               <span className="flex items-center text-gray-700">
                                 <Building2 className="w-3 h-3 mr-1 text-gray-400" />
                                 {user.organization}
                               </span>
                            ) : <span className="text-gray-400 italic">未填寫</span>}
                         </td>
                         <td className="py-3 px-2 text-right space-x-2">
                           <button 
                             onClick={() => {
                               if (window.confirm(`確定要否決 ${user.name} 的申請嗎？`)) {
                                 onDeleteUser(user.email);
                               }
                             }}
                             className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-md text-xs hover:bg-red-50 shadow-sm transition-colors"
                             title="否決申請"
                           >
                             否決
                           </button>
                           <button 
                             onClick={() => {
                               setApprovingUser(user);
                               setApprovalRole(UserRole.MANAGER);
                               setApprovalStation(STATIONS[0].code); 
                             }}
                             className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 shadow-sm transition-colors"
                           >
                             審核 / 分派
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-700">正式人員清單</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="搜尋人員..." 
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-600">姓名 / Email</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">單位 / 角色</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">負責場站</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">狀態</th>
                    <th className="px-6 py-3 font-semibold text-gray-600 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeUsers.map((user) => (
                    <tr key={user.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.organization && (
                           <div className="text-xs text-gray-500 mb-1 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {user.organization}
                           </div>
                        )}
                        <select 
                          value={user.role}
                          onChange={(e) => onUpdateUser(user.email, { role: e.target.value as UserRole })}
                          className="p-1 border rounded text-xs bg-white"
                        >
                          {Object.values(UserRole).filter(r => r !== UserRole.PENDING).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.assignedStation}
                          onChange={(e) => onUpdateUser(user.email, { assignedStation: e.target.value as StationCode | 'ALL' })}
                          className="p-1 border rounded text-xs bg-white max-w-[150px]"
                        >
                          <option value="ALL">全部 (ALL)</option>
                          {STATIONS.map(s => (
                            <option key={s.code} value={s.code}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                           user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                         }`}>
                           {user.isActive ? '啟用中' : '已停用'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end space-x-2">
                         <button
                           onClick={() => onUpdateUser(user.email, { isActive: !user.isActive })}
                           className={`p-2 rounded-lg transition-colors ${
                             user.isActive 
                               ? 'text-red-600 hover:bg-red-50' 
                               : 'text-green-600 hover:bg-green-50'
                           }`}
                           title={user.isActive ? '停用帳號' : '啟用帳號'}
                         >
                           {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                         </button>
                         <button
                           onClick={() => {
                             if(window.confirm(`確定要刪除使用者 ${user.name} 嗎？此動作無法復原。`)) {
                               onDeleteUser(user.email);
                             }
                           }}
                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           title="刪除使用者"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-700 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-gray-500"/>
              系統稽核紀錄
            </h3>
            <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="搜尋..." 
                 value={logSearch}
                 onChange={e => setLogSearch(e.target.value)}
                 className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
               />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600">時間戳記</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">操作者</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">動作</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">詳細內容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-500 text-xs font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">{log.userEmail}</td>
                    <td className="px-6 py-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{log.action}</span></td>
                    <td className="px-6 py-3 text-gray-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-fade-in">
             <div className="p-4 border-b flex justify-between items-center">
               <h3 className="font-bold text-gray-800">核准使用者申請</h3>
               <button onClick={() => setApprovingUser(null)}><X className="w-5 h-5 text-gray-400" /></button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-bold text-gray-500 block mb-1">申請人</label>
                 <p className="font-medium">{approvingUser.name} ({approvingUser.email})</p>
                 {approvingUser.organization && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                       <Building2 className="w-3 h-3 mr-1"/> {approvingUser.organization}
                    </p>
                 )}
               </div>
               
               <div>
                 <label className="text-xs font-bold text-gray-500 block mb-1">指派角色</label>
                 <select 
                   value={approvalRole}
                   onChange={(e) => setApprovalRole(e.target.value as UserRole)}
                   className="w-full p-2 border rounded bg-white"
                 >
                   <option value={UserRole.MANAGER}>經理 (Manager)</option>
                   <option value={UserRole.USER}>一般人員 (User)</option>
                   <option value={UserRole.ADMIN}>管理員 (Admin)</option>
                 </select>
               </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 block mb-1">負責場站</label>
                 <select 
                   value={approvalStation}
                   onChange={(e) => setApprovalStation(e.target.value as StationCode | 'ALL')}
                   className="w-full p-2 border rounded bg-white"
                 >
                   <option value="ALL">全部 (ALL)</option>
                   {STATIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                 </select>
               </div>

               <div className="flex space-x-2 mt-4">
                 <button 
                   onClick={handleRejectUser}
                   className="flex-1 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 font-medium"
                 >
                   否決申請
                 </button>
                 <button 
                   onClick={handleApproveSubmit}
                   className="flex-[2] py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                 >
                   確認核准
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;