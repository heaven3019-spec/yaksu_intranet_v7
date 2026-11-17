import { Employee, LeaveRequest } from '../types';
import { getLeaveTypeLabel } from './leaveCalculator';

const ADMIN_NOTIF_ENABLED_KEY = 'yaksoo_admin_notif_enabled_v1';
const DAILY_NOTIF_SENT_DATE_KEY = 'yaksoo_admin_daily_leave_notif_date_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function isAdminNotificationEnabled(): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const val = localStorage.getItem(ADMIN_NOTIF_ENABLED_KEY);
    // If previously granted and never explicitly disabled, default to enabled
    if (val === null) return true;
    return val === 'true';
  } catch {
    return Notification.permission === 'granted';
  }
}

export function setAdminNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ADMIN_NOTIF_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

export async function requestAdminNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission | 'unsupported';
  message: string;
}> {
  if (!isNotificationSupported()) {
    return {
      granted: false,
      permission: 'unsupported',
      message: '현재 브라우저에서는 시스템 알림을 지원하지 않습니다. 삼성 인터넷 또는 Chrome 앱에서 이용해주세요.',
    };
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setAdminNotificationEnabled(true);
      return {
        granted: true,
        permission: 'granted',
        message: '관리자 잠금화면/상단바 알림이 활성화되었습니다!',
      };
    }
    if (result === 'denied') {
      setAdminNotificationEnabled(false);
      return {
        granted: false,
        permission: 'denied',
        message: '알림 권한이 차단되어 있습니다. 브라우저 주소창 왼쪽 자물쇠/설정 아이콘에서 알림을 "허용"으로 변경해주세요.',
      };
    }
    return {
      granted: false,
      permission: result,
      message: '알림 권한 요청이 보류되었습니다. 다시 눌러 허용해주세요.',
    };
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return {
      granted: false,
      permission: getNotificationPermission(),
      message: '알림 권한 요청 중 오류가 발생했습니다.',
    };
  }
}

export async function sendAdminSystemNotification(
  title: string,
  body: string,
  options?: { tag?: string; url?: string; requireInteraction?: boolean }
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const notifOptions: NotificationOptions & Record<string, unknown> = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: options?.tag || `yaksoo-admin-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: options?.requireInteraction ?? false,
    data: { url: options?.url || '/' },
  };

  // Prefer Service Worker registration.showNotification (required on Android/Galaxy Chrome & PWA)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500)),
        ]);
      }
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification fallback:', swErr);
    }
  }

  // Desktop / non-SW fallback
  try {
    const n = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: notifOptions.tag,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('Direct Notification constructor failed (likely Android without active SW):', err);
    return false;
  }
}

export function formatLocalYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTomorrowLocalDateStr(now = new Date()): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return formatLocalYYYYMMDD(tomorrow);
}

function getLeaveShortLabel(req: LeaveRequest): string {
  switch (req.type) {
    case 'ANNUAL':
      return '전일';
    case 'HALF_AM':
      return '오전반차';
    case 'HALF_PM':
      return '오후반차';
    case 'HOURLY':
      return `시간차(${Math.round(req.daysCount * 8)}h)`;
    case 'QUARTER':
      return '2시간차';
    default:
      return getLeaveTypeLabel(req.type, req.daysCount);
  }
}

export function buildTomorrowLeaveSummary(
  requests: LeaveRequest[],
  employees: Employee[],
  now = new Date()
) {
  const todayStr = formatLocalYYYYMMDD(now);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = formatLocalYYYYMMDD(tomorrow);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const tomorrowLabel = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}(${weekdays[tomorrow.getDay()]})`;

  const activeEmpIds = new Set(
    employees.filter((e) => e.status !== 'RETIRED').map((e) => e.id)
  );

  const matchingRequests = requests.filter(
    (r) =>
      r.status === 'APPROVED' &&
      r.startDate <= tomorrowStr &&
      r.endDate >= tomorrowStr &&
      (activeEmpIds.size === 0 || activeEmpIds.has(r.employeeId))
  );

  if (matchingRequests.length === 0) {
    return {
      todayStr,
      tomorrowStr,
      tomorrowLabel,
      matchingRequests,
      title: `📅 내일(${tomorrowLabel}) 연차 예정자 없음`,
      body: '내일 승인된 연차·반차 예정 직원이 없습니다.',
    };
  }

  const summaryItems = matchingRequests.map(
    (r) => `${r.employeeName}(${getLeaveShortLabel(r)})`
  );

  return {
    todayStr,
    tomorrowStr,
    tomorrowLabel,
    matchingRequests,
    title: `📅 내일(${tomorrowLabel}) 연차 예정자 ${matchingRequests.length}명`,
    body: summaryItems.join(', '),
  };
}

/**
 * Check if it is >= 09:30 AM local time and today's tomorrow-leave digest hasn't been sent yet.
 * Strictly call only when logged in as ADMIN.
 */
export async function checkAndTriggerDailyTomorrowLeaveNotification(
  requests: LeaveRequest[],
  employees: Employee[],
  force = false
): Promise<{ sent: boolean; summaryText?: string }> {
  if (!isNotificationSupported()) return { sent: false };
  if (!force && !isAdminNotificationEnabled()) return { sent: false };
  if (Notification.permission !== 'granted') return { sent: false };

  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = 9 * 60 + 30; // 09:30 AM

  if (!force && minutesSinceMidnight < targetMinutes) {
    return { sent: false };
  }

  const summary = buildTomorrowLeaveSummary(requests, employees, now);

  if (!force) {
    try {
      const lastSentDate = localStorage.getItem(DAILY_NOTIF_SENT_DATE_KEY);
      if (lastSentDate === summary.todayStr) {
        return { sent: false };
      }
    } catch {
      // continue
    }
  }

  const ok = await sendAdminSystemNotification(summary.title, summary.body, {
    tag: `yaksoo-daily-${summary.todayStr}`,
    url: '/',
    requireInteraction: false,
  });

  if (ok && !force) {
    try {
      localStorage.setItem(DAILY_NOTIF_SENT_DATE_KEY, summary.todayStr);
    } catch {
      // ignore
    }
  }

  return {
    sent: ok,
    summaryText: `${summary.title} - ${summary.body}`,
  };
}

/**
 * Notify Admin immediately when new PENDING leave request(s) arrive.
 * Strictly call only when logged in as ADMIN.
 */
export async function notifyNewLeaveRequestsForAdmin(
  newPendingRequests: LeaveRequest[]
): Promise<boolean> {
  if (!newPendingRequests || newPendingRequests.length === 0) return false;
  if (!isAdminNotificationEnabled()) return false;

  if (newPendingRequests.length === 1) {
    const req = newPendingRequests[0];
    const dateRange =
      req.endDate && req.endDate !== req.startDate
        ? `${req.startDate} ~ ${req.endDate}`
        : req.startDate;
    const typeLabel = getLeaveTypeLabel(req.type, req.daysCount);
    const reasonText = req.reason ? ` / 사유: ${req.reason}` : '';

    return sendAdminSystemNotification(
      `🔔 새 연차 신청: ${req.employeeName} (${req.position || '직원'})`,
      `${dateRange} · ${typeLabel}${reasonText}`,
      {
        tag: `yaksoo-new-req-${req.id}`,
        url: '/',
        requireInteraction: true,
      }
    );
  }

  const previewNames = newPendingRequests
    .slice(0, 3)
    .map((r) => `${r.employeeName}(${r.startDate})`)
    .join(', ');
  const extra = newPendingRequests.length > 3 ? ` 외 ${newPendingRequests.length - 3}건` : '';

  return sendAdminSystemNotification(
    `🔔 새 연차 신청 ${newPendingRequests.length}건 도착`,
    `${previewNames}${extra}`,
    {
      tag: `yaksoo-new-req-batch-${Date.now()}`,
      url: '/',
      requireInteraction: true,
    }
  );
}
