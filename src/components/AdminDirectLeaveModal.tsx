import React, { useState, useEffect } from 'react';
import { Employee, LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { calculateEmployeeCycles, calculateWorkingDays } from '../utils/leaveCalculator';
import { isNonWorkingDay, getNonWorkingDayReason } from '../utils/koreanHolidays';
import { 
  UserCheck, 
  X, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  FileEdit,
  User,
  Info
} from 'lucide-react';

interface AdminDirectLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  requests: LeaveRequest[];
  adminName: string;
  onSubmit: (newRequest: Omit<LeaveRequest, 'id' | 'requestedAt'>) => Promise<void>;
}

export const AdminDirectLeaveModal: React.FC<AdminDirectLeaveModalProps> = ({
  isOpen,
  onClose,
  employees,
  requests,
  adminName,
  onSubmit,
}) => {
  // Filter active staff only (exclude system admin account)
  const activeStaff = employees.filter(
    (e) => e.status !== 'RETIRED' && e.role !== 'ADMIN' && e.id !== 'admin-001'
  );

  const [selectedEmpId, setSelectedEmpId] = useState<string>(activeStaff[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hourlyHours, setHourlyHours] = useState<number>(1);
  const [reason, setReason] = useState<string>('신청 누락분 관리자 대리 등록');
  const [status, setStatus] = useState<LeaveStatus>('APPROVED');
  const [calculatedDays, setCalculatedDays] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeStaff.length > 0 && !selectedEmpId) {
      setSelectedEmpId(activeStaff[0].id);
    }
  }, [activeStaff, selectedEmpId]);

  const targetEmp = employees.find((e) => e.id === selectedEmpId) || activeStaff[0];
  const empCycles = targetEmp ? calculateEmployeeCycles(targetEmp, requests) : [];
  const currentCycle = empCycles.find((c) => c.isCurrent) || empCycles[0];
  let targetCycle = empCycles.find((c) => startDate >= c.startDate && startDate <= c.endDate) || null;
  if (!targetCycle && targetEmp && startDate && targetEmp.joinDate) {
    const dynCycles = calculateEmployeeCycles(targetEmp, requests, new Date(startDate + 'T00:00:00'));
    targetCycle = dynCycles.find((c) => startDate >= c.startDate && startDate <= c.endDate) || null;
  }
  if (!targetCycle) {
    targetCycle = currentCycle;
  }
  const isFutureCycle = Boolean(targetCycle && currentCycle && targetCycle.cycleIndex > currentCycle.cycleIndex);

  useEffect(() => {
    if (leaveType === 'HALF_AM' || leaveType === 'HALF_PM') {
      setEndDate(startDate);
      setCalculatedDays(0.5);
    } else if (leaveType === 'HOURLY') {
      setEndDate(startDate);
      setCalculatedDays(Number((hourlyHours / 8).toFixed(3)));
    } else if (leaveType === 'QUARTER') {
      setEndDate(startDate);
      setCalculatedDays(0.25);
    } else {
      const days = calculateWorkingDays(startDate, endDate, leaveType);
      setCalculatedDays(days);
    }
  }, [startDate, endDate, leaveType, hourlyHours]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!targetEmp) {
      setErrorMsg('대상 직원을 선택해주세요.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('시작일자와 종료일자를 입력해주세요.');
      return;
    }

    if (startDate > endDate && leaveType !== 'HALF_AM' && leaveType !== 'HALF_PM' && leaveType !== 'HOURLY') {
      setErrorMsg('종료일자가 시작일자보다 앞설 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalEnd = (leaveType === 'HALF_AM' || leaveType === 'HALF_PM' || leaveType === 'HOURLY') ? startDate : endDate;

      await onSubmit({
        employeeId: targetEmp.id,
        employeeName: targetEmp.name,
        position: targetEmp.position,
        type: leaveType,
        startDate,
        endDate: finalEnd,
        daysCount: calculatedDays,
        reason: reason.trim() || '관리자 직권 연차 등록',
        contactEmergency: targetEmp.phone || '010-0000-0000',
        status,
        reviewedAt: status === 'APPROVED' ? new Date().toISOString() : undefined,
        reviewedBy: status === 'APPROVED' ? `${adminName} (관리자 직권 등록)` : undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || '대리 연차 등록 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/30 rounded-xl text-blue-400 border border-blue-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">직원 연차 대리 등록 (관리자 직권)</h3>
              <p className="text-xs text-slate-300">
                직원이 신청 누락한 연차, 반차, 외출(시간차)을 관리자가 직접 등록합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Employee Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              대상 직원 선택 <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden cursor-pointer"
            >
              {activeStaff.map((emp) => {
                const cycles = calculateEmployeeCycles(emp, requests);
                const curr = cycles.find((c) => c.isCurrent) || cycles[0];
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.role === 'ADMIN' ? '[관리자] ' : '[직원] '}{emp.name} ({emp.position}) · 입사일: {emp.joinDate.replace(/-/g, '.')} · 잔여: {curr?.remainingDays || 0}일
                  </option>
                );
              })}
            </select>
          </div>

          {targetEmp && targetCycle && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${isFutureCycle ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900' : 'bg-blue-50/70 border-blue-200/80 text-blue-900'}`}>
              <span className="font-semibold">
                {isFutureCycle ? `${startDate.slice(0, 4)}년 차기 잔여 연차: ` : '선택 직원 잔여 연차: '}
                <strong className={`font-extrabold text-sm ${isFutureCycle ? 'text-indigo-700' : 'text-blue-700'}`}>{targetCycle.remainingDays}일</strong>
                <span className="text-slate-500 ml-1">(부여 {targetCycle.totalGranted}일 / 사용 {targetCycle.usedDays}일)</span>
              </span>
              <span className={`text-[11px] bg-white px-2 py-0.5 rounded font-bold border ${isFutureCycle ? 'border-indigo-200 text-indigo-800' : 'border-blue-200 text-blue-800'}`}>
                {targetCycle.label?.split(' ')[0] || '현재 주기'}
              </span>
            </div>
          )}

          {/* 2. Leave Type (2x Big readable buttons) */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-2">
              휴가 구분 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {[
                { type: 'ANNUAL' as LeaveType, label: '전일 연차', sub: '1.0일 차감' },
                { type: 'HALF_AM' as LeaveType, label: '오전 반차', sub: '0.5일 (오전)' },
                { type: 'HALF_PM' as LeaveType, label: '오후 반차', sub: '0.5일 (오후)' },
                { type: 'HOURLY' as LeaveType, label: '시간차(외출)', sub: '1시간 단위' },
                { type: 'SPECIAL' as LeaveType, label: '경조사 휴가', sub: '특별 유급' },
                { type: 'SICK' as LeaveType, label: '병가', sub: '진단서 휴가' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setLeaveType(item.type)}
                  className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    leaveType === item.type
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <p className="font-black text-sm sm:text-base leading-tight">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                시작일자 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden"
              />
              {isNonWorkingDay(startDate) && (
                <p className="text-[11px] text-amber-600 font-bold mt-1">
                  ⚠️ {getNonWorkingDayReason(startDate)} (공휴일/주말)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                종료일자 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={leaveType === 'HALF_AM' || leaveType === 'HALF_PM' || leaveType === 'HOURLY'}
                value={leaveType === 'HALF_AM' || leaveType === 'HALF_PM' || leaveType === 'HOURLY' ? startDate : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden disabled:opacity-50"
              />
            </div>
          </div>

          {/* Hourly Hours if HOURLY */}
          {leaveType === 'HOURLY' && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                외출/시간차 사용 시간
              </label>
              <select
                value={hourlyHours}
                onChange={(e) => setHourlyHours(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                  <option key={h} value={h}>
                    {h}시간 ({Number((h / 8).toFixed(3))}일 차감)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Calculated Days Summary */}
          <div className="bg-slate-100 p-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-slate-700">차감 계산 일수:</span>
            <strong className="text-blue-700 font-black text-base">{calculatedDays}일</strong>
          </div>

          {/* 4. Reason */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              사유 기재
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 신청 누락분 관리자 대리 등록, 개인사정 등"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden"
            />
          </div>

          {/* 5. Approval Status Selection */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              결재 처리 상태
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('APPROVED')}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  status === 'APPROVED'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ✓ 즉시 승인 완료 (기본)
              </button>
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  status === 'PENDING'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                결재 대기 상태로 등록
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>등록 중...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>대리 연차 등록 완료</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
