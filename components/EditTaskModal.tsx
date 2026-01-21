import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { X } from 'lucide-react';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, newStatus: TaskStatus, attachmentUrl: string) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [attachment, setAttachment] = useState('');

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setAttachment(task.attachmentUrl || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.uid, status, attachment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">更新進度</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">任務序號 (UID)</label>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{task.uid}</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">工項名稱</label>
            <p className="text-sm font-medium text-gray-900">{task.itemName}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">執行狀態</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.values(TaskStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
               佐證資料連結 (URL)
            </label>
            <input
              type="url"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">請貼上 Google Drive 檔案連結或資料夾連結</p>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              確認更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;