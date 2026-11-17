import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, BellOff, X, Send, CalendarCheck, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Employee, LeaveRequest } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  isAdminNotificationEnabled,
  setAdminNotificationEnabled,
  requestAdminNotificationPermission,
  sendAdminSystemNotification,
  checkAndTriggerDailyTomorrowLeaveNotification,
  buildTomorrowLeaveSummary,
} from '../utils/adminNotifications';

interface AdminNotificationControlProps {
  employees: Employee[];
  requests: LeaveRequest[];
  compact?: boolean;
  onFeedback?: (text: string, type: 'success' | 'info' | 'error') => void;
}

export const AdminNotificationControl: React.FC<AdminNotificationControlProps> = ({
  employees,
  requests,
  compact = false,
  onFeedback,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermission()
  );
  const [enabled, setEnabled] = useState<boolean>(() => isAdminNotificationEnabled());
  const [statusMessage, setStatusMessage] = useState<string>('');

  const refreshState = useCallback(() => {
    setPermission(getNotificationPermission());
    setEnabled(isAdminNotificationEnabled());
  }, []);

  useEffect(() => {
    refreshState();
    const onFocus = () => refreshState();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshState]);

  const isActive = permission === 'granted' && enabled;
  const tomorrowPreview = buildTomorrowLeaveSummary(requests, employees);

  const handleEnableOrToggle = async () => {
    if (!isNotificationSupported()) {
      const msg = '이 브라우저에서는 알림 기능을 지원하지 않습니다. 삼성 인터넷 또는 Chrome 앱으로 열어주세요.';
      setStatusMessage(msg);
      onFeedback?.(msg, 'error');
      return;
    }

    if (permission !== 'granted') {
      const res = await requestAdminNotificationPermission();
      refreshState();
      setStatusMessage(res.message);
      onFeedback?.(res.message, res.granted ? 'success' : 'error');
      return;
    }

    const next = !enabled;
    setAdminNotificationEnabled(next);
    refreshState();
    const msg = next
      ? '관리자 잠금화면·상단바 알림이 켜졌습니다.'
      : '관리자 시스템 알림이 일시 중지되었습니다.';
    setStatusMessage(msg);
    onFeedback?.(msg, next ? 'success' : 'info');
  };

  const handleSendTest = async () => {
    if (permission !== 'granted') {
      const res = await requestAdminNotificationPermission();
      refreshState();
      if (!res.granted) {
        setStatusMessage(res.message);
        onFeedback?.(res.message, 'error');
        return;
      }
    }

    const ok = await sendAdminSystemNotification(
      '🔔 [약수 연차관리] 관리자 테스트 알림',
      '갤럭시 잠금화면 및 상단 알림창에 정상 표시됩니다. (새 연차 신청 & 매일 09:30 알림 작동 준비 완료)',
      { tag: `yaksoo-test-${Date.now()}`, url: '/' }
    );

    if (ok) {
      const msg = '테스트 알림을 발송했습니다! 스마트폰 상단바/잠금화면을 확인해주세요.';
      setStatusMessage(msg);
      onFeedback?.(msg, 'success');
    } else {
      const msg = '알림 발송에 실패했습니다. 브라우저 알림 권한을 확인해주세요.';
      setStatusMessage(msg);
      onFeedback?.(msg, 'error');
    }
  };

  const handlePreviewTomorrow = async () => {
    if (permission !== 'granted') {
      const res = await requestAdminNotificationPermission();
      refreshState();
      if (!res.granted) {
        setStatusMessage(res.message);
        onFeedback?.(res.message, 'error');
        return;
      }
    }

    const result = await checkAndTriggerDailyTomorrowLeaveNotification(requests, employees, true);
    if (result.sent) {
      const msg = `내일 연차 알림 미리보기 발송 완료: ${result.summaryText}`;
      setStatusMessage(msg);
      onFeedback?.('내일의 연차 예정자 알림을 발송했습니다.', 'success');
    } else {
      setStatusMessage('알림 권한을 먼저 허용해주세요.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          refreshState();
          setIsOpen(true);
        }}
        className={`inline-flex items-center space-x-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
        } ${
          isActive
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
        }`}
        title="관리자 전용 잠금화면·상단바 알림 설정"
      >
        {isActive ? (
          <BellRing className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Bell className="w-3.5 h-3.5 text-amber-600" />
        )}
        <span>{isActive ? '알림 ON' : '알림 켜기'}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <BellRing className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">관리자 전용 알림 설정</h3>
                  <p className="text-[11px] text-slate-300">관리자 계정으로 로그인한 기기에서만 동작합니다</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm text-slate-700">
              {/* Current Status Card */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-200'
                    : permission === 'denied'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : permission === 'denied' ? (
                    <BellOff className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {isActive
                        ? '알림 활성화됨'
                        : permission === 'denied'
                        ? '브라우저 알림 차단됨'
                        : '알림 꺼짐 (허용 필요)'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {isActive
                        ? '새 연차 신청 즉시 & 매일 오전 9:30 내일 연차자 알림'
                        : permission === 'denied'
                        ? '브라우저 주소창 자물쇠 → 권한 → 알림 "허용" 필요'
                        : '아래 버튼을 눌러 갤럭시 알림 권한을 허용하세요.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnableOrToggle}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  {permission !== 'granted' ? '권한 허용' : isActive ? '일시 끄기' : '알림 켜기'}
                </button>
              </div>

              {statusMessage && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 font-medium">
                  {statusMessage}
                </div>
              )}

              {/* Trigger summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <p className="font-bold text-slate-900 text-xs">자동 발송되는 관리자 알림 2가지</p>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p>
                    1️⃣ <strong>매일 오전 9시 30분:</strong> 다음 날 승인된 연차·반차 직원 요약 알림
                  </p>
                  <p>
                    2️⃣ <strong>실시간 연차 신청 시:</strong> 직원이 연차·반차·시간차를 신청하면 즉시 알림
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-blue-700">{tomorrowPreview.title}:</span>{' '}
                  <span className="text-slate-700">{tomorrowPreview.body}</span>
                </div>
              </div>

              {/* Action Buttons: Test & Preview */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleSendTest}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>테스트 알림 보내기</span>
                </button>
                <button
                  type="button"
                  onClick={handlePreviewTomorrow}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>내일 연차 미리보기</span>
                </button>
              </div>

              {/* Galaxy Optimization Tip */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-blue-900">
                <p className="font-bold flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>갤럭시 잠금화면 알림을 안정적으로 받는 팁</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800 leading-relaxed">
                  <li>
                    <strong>홈 화면에 앱 추가</strong> 후 실행해 두세요.
                  </li>
                  <li>
                    갤럭시 <strong>설정 → 애플리케이션 → 약수 연차관리(또는 브라우저) → 배터리 → 제한 없음</strong>으로 두면 화면이 꺼져도 백그라운드 알림 수신이 원활합니다.
                  </li>
                  <li>
                    완전 종료(최근 앱에서 스와이프 삭제) 대신 홈 버튼을 눌러 백그라운드에 열어 두시면 무료 실시간 알림이 유지됩니다.
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
