import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center space-x-2 shadow-md z-40"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>오프라인 상태입니다 — 저장된 최근 데이터를 표시하며 연결 복구 시 자동 동기화됩니다.</span>
    </div>
  );
};
