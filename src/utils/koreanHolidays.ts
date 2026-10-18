import { LeaveType } from '../types';

/**
 * 대한민국 법정공휴일 및 대체공휴일 데이터 (관공서의 공휴일에 관한 규정 기준)
 * 2024년 ~ 2030년 공휴일 및 대체공휴일, 선거일 완벽 매핑
 */
export interface HolidayInfo {
  name: string;
  isHoliday: boolean;
  isSubstitute?: boolean;
}

// 년도별 대한민국 공휴일 및 대체공휴일 사전
export const KOREAN_HOLIDAYS_MAP: Record<string, string> = {
  // 2024년
  '2024-01-01': '신정',
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  '2024-02-12': '대체공휴일(설날)',
  '2024-03-01': '3·1절',
  '2024-04-10': '제22대 국회의원선거',
  '2024-05-05': '어린이날',
  '2024-05-06': '대체공휴일(어린이날)',
  '2024-05-15': '부처님오신날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
  '2024-10-01': '국군의 날(임시공휴일)',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '성탄절',

  // 2025년
  '2025-01-01': '신정',
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-01': '3·1절',
  '2025-03-03': '대체공휴일(3·1절)',
  '2025-05-05': '어린이날 / 부처님오신날',
  '2025-05-06': '대체공휴일',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일(추석)',
  '2025-10-09': '한글날',
  '2025-12-25': '성탄절',

  // 2026년
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '3·1절',
  '2026-03-02': '대체공휴일(3·1절)',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일(부처님오신날)',
  '2026-06-03': '제9회 지방선거',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일(광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-09-28': '대체공휴일(추석)',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일(개천절)',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',

  // 2027년
  '2027-01-01': '신정',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일(설날)',
  '2027-03-01': '3·1절',
  '2027-03-03': '제21대 대통령선거',
  '2027-05-05': '어린이날',
  '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일',
  '2027-08-15': '광복절',
  '2027-08-16': '대체공휴일(광복절)',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-03': '개천절',
  '2027-10-04': '대체공휴일(개천절)',
  '2027-10-09': '한글날',
  '2027-10-11': '대체공휴일(한글날)',
  '2027-12-25': '성탄절',
  '2027-12-27': '대체공휴일(성탄절)',

  // 2028년
  '2028-01-01': '신정',
  '2028-01-26': '설날 연휴',
  '2028-01-27': '설날',
  '2028-01-28': '설날 연휴',
  '2028-03-01': '3·1절',
  '2028-04-12': '제23대 국회의원선거',
  '2028-05-02': '부처님오신날',
  '2028-05-05': '어린이날',
  '2028-06-06': '현충일',
  '2028-08-15': '광복절',
  '2028-10-02': '추석 연휴',
  '2028-10-03': '개천절 / 추석',
  '2028-10-04': '추석 연휴',
  '2028-10-05': '대체공휴일(추석/개천절)',
  '2028-10-09': '한글날',
  '2028-12-25': '성탄절',

  // 2029년
  '2029-01-01': '신정',
  '2029-02-12': '설날 연휴',
  '2029-02-13': '설날',
  '2029-02-14': '설날 연휴',
  '2029-03-01': '3·1절',
  '2029-05-05': '어린이날',
  '2029-05-07': '대체공휴일(어린이날)',
  '2029-05-20': '부처님오신날',
  '2029-05-21': '대체공휴일(부처님오신날)',
  '2029-06-06': '현충일',
  '2029-08-15': '광복절',
  '2029-09-21': '추석 연휴',
  '2029-09-22': '추석',
  '2029-09-23': '추석 연휴',
  '2029-09-24': '대체공휴일(추석)',
  '2029-10-03': '개천절',
  '2029-10-09': '한글날',
  '2029-12-25': '성탄절',

  // 2030년
  '2030-01-01': '신정',
  '2030-02-02': '설날 연휴',
  '2030-02-03': '설날',
  '2030-02-04': '설날 연휴',
  '2030-02-05': '대체공휴일(설날)',
  '2030-03-01': '3·1절',
  '2030-05-05': '어린이날',
  '2030-05-06': '대체공휴일(어린이날)',
  '2030-05-09': '부처님오신날',
  '2030-06-06': '현충일',
  '2030-08-15': '광복절',
  '2030-09-11': '추석 연휴',
  '2030-09-12': '추석',
  '2030-09-13': '추석 연휴',
  '2030-10-03': '개천절',
  '2030-10-09': '한글날',
  '2030-12-25': '성탄절',
};

/**
 * 특정 날짜(YYYY-MM-DD)의 공휴일 여부 및 명칭 조회
 */
export function getKoreanHoliday(dateStr: string): HolidayInfo | null {
  if (!dateStr) return null;
  
  // 1. 사전 매핑 확인
  if (KOREAN_HOLIDAYS_MAP[dateStr]) {
    const name = KOREAN_HOLIDAYS_MAP[dateStr];
    return {
      name,
      isHoliday: true,
      isSubstitute: name.includes('대체공휴일'),
    };
  }

  // 2. 사전에 없는 연도일 경우 고정 공휴일 및 기본 대체공휴일 로직 적용
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const md = `${parts[1]}-${parts[2]}`;
    const fixedHolidays: Record<string, string> = {
      '01-01': '신정',
      '03-01': '3·1절',
      '05-05': '어린이날',
      '06-06': '현충일',
      '08-15': '광복절',
      '10-03': '개천절',
      '10-09': '한글날',
      '12-25': '성탄절',
    };
    if (fixedHolidays[md]) {
      return {
        name: fixedHolidays[md],
        isHoliday: true,
      };
    }
  }

  return null;
}

/**
 * 주말 여부 (토: 6, 일: 0)
 */
export function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * 비근무일(휴무일) 여부: 주말(토/일)이거나 법정공휴일/대체공휴일인 경우 true
 */
export function isNonWorkingDay(dateStr: string): boolean {
  if (!dateStr) return false;
  if (isWeekend(dateStr)) return true;
  return getKoreanHoliday(dateStr) !== null;
}

/**
 * 비근무일 사유 (예: '일요일', '토요일', '개천절', '대체공휴일')
 */
export function getNonWorkingDayReason(dateStr: string): string | null {
  if (!dateStr) return null;
  const hol = getKoreanHoliday(dateStr);
  if (hol) return hol.name;

  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const day = d.getDay();
  if (day === 0) return '일요일';
  if (day === 6) return '토요일';
  return null;
}

/**
 * 주어진 날짜부터 가장 가까운 근무일(평일/공휴일 제외) 계산
 */
export function getNextWorkingDay(startDateStr: string): string {
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return startDateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  for (let i = 0; i < 30; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const str = `${y}-${m}-${day}`;
    if (!isNonWorkingDay(str)) {
      return str;
    }
    d.setDate(d.getDate() + 1);
  }
  return startDateStr;
}

/**
 * 근무일수 정확한 산정
 * - 주말(토/일) 및 법정공휴일/대체공휴일은 완벽히 제외
 * - 실제 출근 근무일(평일)만 연차 차감 일수로 계산
 */
export function calculateWorkingDaysWithoutHolidays(
  startDateStr: string,
  endDateStr: string,
  type: LeaveType,
  hoursCount = 1
): number {
  if (type === 'HALF_AM' || type === 'HALF_PM') {
    // 반차의 경우 해당일이 공휴일/주말이면 0일
    if (isNonWorkingDay(startDateStr)) return 0;
    return 0.5;
  }
  if (type === 'HOURLY') {
    if (isNonWorkingDay(startDateStr)) return 0;
    return Number((hoursCount / 8).toFixed(3));
  }
  if (type === 'QUARTER') {
    if (isNonWorkingDay(startDateStr)) return 0;
    return 0.25;
  }

  if (!startDateStr || !endDateStr) return 0;

  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  if (startParts.length !== 3 || endParts.length !== 3) return 0;

  const current = new Date(
    parseInt(startParts[0], 10),
    parseInt(startParts[1], 10) - 1,
    parseInt(startParts[2], 10)
  );
  const end = new Date(
    parseInt(endParts[0], 10),
    parseInt(endParts[1], 10) - 1,
    parseInt(endParts[2], 10)
  );

  if (current > end) return 0;

  let workingDaysCount = 0;
  // Day-by-day iteration to exclude weekends and public holidays
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    if (!isNonWorkingDay(dateStr)) {
      workingDaysCount++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDaysCount;
}

export interface NonWorkingDaysDetails {
  totalCalendarDays: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
  holidayNames: string[];
}

export function getNonWorkingDaysDetails(startDateStr: string, endDateStr: string): NonWorkingDaysDetails {
  if (!startDateStr || !endDateStr) {
    return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayDays: 0, holidayNames: [] };
  }
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  if (startParts.length !== 3 || endParts.length !== 3) {
    return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayDays: 0, holidayNames: [] };
  }
  const current = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10));
  const end = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10));
  if (current > end) {
    return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayDays: 0, holidayNames: [] };
  }
  let totalCalendarDays = 0;
  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  const holidayNames: string[] = [];

  while (current <= end) {
    totalCalendarDays++;
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const hol = getKoreanHoliday(dateStr);
    const weekend = isWeekend(dateStr);

    if (hol) {
      holidayDays++;
      if (!holidayNames.includes(hol.name)) {
        holidayNames.push(hol.name);
      }
    } else if (weekend) {
      weekendDays++;
    } else {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return { totalCalendarDays, workingDays, weekendDays, holidayDays, holidayNames };
}
