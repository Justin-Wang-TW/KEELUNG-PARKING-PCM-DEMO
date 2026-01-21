import React, { useState, useMemo } from 'react';
import { Task, User, StationCode, TaskStatus, UserRole } from '../types';
import { STATIONS, STATUS_COLORS } from '../constants';
import { Filter, Search, Plus, History, Edit, Paperclip, ClipboardCheck } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
  onViewHistory: (taskUid: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, currentUser, onEditTask, onCreateTask, onViewHistory }) => {
  // Logic: Users/Managers are locked to their assigned station. Admins can see ALL.
  const initialStation = currentUser.assignedStation === 'ALL' ? 'ALL' : currentUser.assignedStation;
  const [filterStation, setFilterStation] = useState<string>(initialStation);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Security Check: Even if UI dropdown is bypassed, enforce logic here for non-admins
      const userAllowedStation = currentUser.assignedStation === 'ALL' ? 'ALL' : currentUser.assignedStation;
      if (userAllowedStation !== 'ALL' && task.stationCode !== userAllowedStation) {
        return false; 
      }

      const matchStation = filterStation === 'ALL' || task.stationCode === filterStation;
      const matchStatus = filterStatus === 'ALL' || task.status === filterStatus;
      const matchSearch = task.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.uid.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStation && matchStatus && matchSearch;
    });
  }, [tasks, filterStation, filterStatus, searchTerm, currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center">
             <ClipboardCheck className="w-6 h-6 mr-2 text-blue-600" />
             進度匯報
           </h2>
           <p className="text-gray-500 mt-1">
             {currentUser.assignedStation === 'ALL' 
               ? '檢核全區履約工項並追蹤進度' 
               : '請檢核本場站應執行項目，並填報進度與上傳佐證'}
           </p>
        </div>
        
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
          <button
            onClick={onCreateTask}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            發佈新工項
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋 UID 或項目名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1 font-bold">場站篩選</label>
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            disabled={currentUser.assignedStation !== 'ALL'}
            className="w-full p-2 border rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="ALL">所有場站</option>
            {STATIONS.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1 font-bold">狀態篩選</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white"
          >
            <option value="ALL">所有狀態</option>
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">UID / 場站</th>
                <th className="px-6 py-4 font-semibold text-gray-600">項目名稱</th>
                <th className="px-6 py-4 font-semibold text-gray-600">截止日期</th>
                <th className="px-6 py-4 font-semibold text-gray-600">狀態</th>
                <th className="px-6 py-4 font-semibold text-gray-600">執行人</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">回報/檢視</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    查無符合條件的工項
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-500 mb-1">{task.uid}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {task.stationName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{task.itemName}</div>
                      {task.attachmentUrl && (
                         <a href={task.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs flex items-center mt-1">
                            <Paperclip className="w-3 h-3 mr-1" />
                            已上傳佐證
                         </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {task.deadline}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[task.status]}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {task.executorEmail || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEditTask(task)}
                          className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                          title="填寫進度與上傳照片"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          匯報進度
                        </button>
                        <button
                          onClick={() => onViewHistory(task.uid)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title="查看歷程"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskList;