import { Station, StationCode, Task, TaskStatus, User, UserRole } from './types';

/**
 * 系統組態設定
 * 請確保 SCRIPT_URL 是你 GAS 部署後產生的「網頁應用程式 URL」
 */
export const APP_CONFIG = {
  SHEET_ID: '1LpG_l0jXduLXVpybRFQIs78WjAdq7tTueB_NvSTiIUU',
  // 注意：此處 URL 應與 App.tsx 中使用的 API 位址保持一致
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz24IUah-cmxaqPMk27z0-eBRqjYvLKFx6QT0MyrVGGWYxPeU51C1eOFw_7ZkYs5K8e/exec'
};

/**
 * 停車場基本資料定義
 */
export const STATIONS: Station[] = [
  { code: StationCode.BAIFU, name: '百福立體停車場' },
  { code: StationCode.CHENG, name: '成功立體停車場' },
  { code: StationCode.XINYI, name: '信義國小地下停車場' },
  { code: StationCode.SHELIAO, name: '社寮橋平面停車場' },
];

/**
 * 根據場站名稱轉換為代碼的工具函數
 */
export const getStationCodeByName = (name: string): StationCode => {
  const station = STATIONS.find(s => s.name === name);
  return station ? station.code : StationCode.BAIFU; // 預設回傳百福
};

/**
 * 模擬使用者名單 - 已清空
 * 系統現在將完全依照 [3_使用者權限表] 的內容進行身份驗證
 */
export const MOCK_USERS: User[] = [];

/**
 * 初始任務資料 - 已清空
 * 系統啟動後會顯示讀取中，直到成功從 Google Sheets 抓取資料
 */
export const INITIAL_TASKS: Task[] = [];

/**
 * 前端 UI 狀態標籤顏色設定
 */
export const STATUS_COLORS = {
  [TaskStatus.PENDING]: 'bg-gray-100 text-gray-800 border-gray-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [TaskStatus.OVERDUE]: 'bg-red-100 text-red-800 border-red-200',
};
