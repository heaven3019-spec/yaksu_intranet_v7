import React, { useState } from 'react';
import { Employee, LeaveCycleInfo, LeaveRequest } from '../types';
import { calculateTenure, getLeaveTypeLabel } from '../utils/leaveCalculator';
import { 
  CheckCircle2, 
  PlusCircle, 
  ShieldCheck,
  ChevronRight,
  Calendar,
  Clock,
  ArrowRight,
  Printer,
  FileText,
  Info,
  CalendarDays
} from 'lucide-react';
import { LeaveDetailModal } from './LeaveDetailModal';

interface EmployeeDashboardProps {
  employee: Employee;
  currentCycle: LeaveCycleInfo | null;
  allCycles: LeaveCycleInfo[];
  requests: LeaveRequest[];
  onOpenRequestModal: () => void;
  onCancelRequest: (requestId: string) => void;
  onViewYearlyDetail: (cycleIndex: number, statusFilter?: 'ALL' | 'APPROVED' | 'PENDING') => void;
  onOpenPrintModal: (req?: LeaveRequest) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  employee,
  currentCycle,
  allCycles,
  requests = [],
  onOpenRequestModal,
  onCancelRequest,
  onViewYearlyDetail,
  onOpenPrintModal,
}) => {
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<LeaveRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const handleOpenDetailModal = (req: LeaveRequest) => {
    setSelectedDetailRequest(req);
    setIsDetailModalOpen(true);
  };

  const myRecentRequests = (requests || [])
    .filter((r) => r.employeeId === employee.id)
    .sort((a, b) => (b.requestedAt || b.startDate).localeCompare(a.requestedAt || a.startDate))
    .slice(0, 5);

  const tenure = calculateTenure(employee.joinDate);

  // Current active cycle for the dashboard
  const activeCycle = currentCycle || allCycles.find((c) => c.isCurrent) || allCycles[0];

  // Metrics for active cycle
  const totalGranted = activeCycle ? activeCycle.totalGranted : 0;
  const usedDays = activeCycle ? activeCycle.usedDays : 0;
  const pendingDays = activeCycle ? activeCycle.pendingDays : 0;
  const remainingDays = activeCycle ? activeCycle.remainingDays : 0;
  const usageRate = activeCycle ? activeCycle.usageRate : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============================================================== */}
      {/* 1. Mobile Priority: Large Direct Leave Request Button Card    */}
      {/*    - 간단하고 명확한 "연차 신청하기" 타이틀                     */}
      {/*    - 50~60대 맞춤 크고 시원한 터치 영역 및 잔여 연차 안내      */}
      {/* ============================================================== */}
      <div className="block sm:hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                연차 신청하기
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                현재 잔여 연차: <strong className="text-amber-300 font-bold text-sm">{remainingDays}일</strong> 사용 가능
              </p>
            </div>
            
            <button
              id="mobile-primary-leave-request-btn"
              onClick={onOpenRequestModal}
              className="h-13 px-5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold text-base rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer flex-shrink-0"
              title="클릭하여 연차 신청서 작성"
            >
              <PlusCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>신청하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Employee Profile & Department (이름과 소속 정보 카드)       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md shadow-blue-500/20">
            {employee.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {employee.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {employee.position}
              </span>
              {employee.role === 'ADMIN' && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>관리자</span>
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs sm:text-sm text-slate-500 mt-1">
              <span>소속: <strong className="text-slate-800 font-semibold">{employee.department || '동작구립 약수데이케어센터'}</strong></span>
              <span className="text-slate-300">·</span>
              <span>입사일: <strong className="text-slate-700 font-medium">{employee.joinDate.replace(/-/g, '.')}</strong></span>
              <span className="text-slate-300">·</span>
              <span>근속: <strong className="text-blue-700 font-bold">{tenure.years}년 {tenure.months}개월</strong> ({tenure.years + 1}년차)</span>
            </div>
          </div>
        </div>

        {/* Desktop / Tablet Prominent Action Button */}
        <div className="hidden sm:flex items-center space-x-2.5 flex-shrink-0">
          <button
            id="desktop-open-leave-request-btn"
            onClick={onOpenRequestModal}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-base font-bold shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-white" />
            <span>신규 연차 신청하기</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. Pure 1-Year Cycle Dashboard (대시보드 칸 안에는 대시보드만)  */}
      {/*    (1년 총 발생 연차, 사용한 연차, 결제 대기, 미사용 잔여 연차) */}
      {/* ============================================================== */}
      {activeCycle && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
          {/* Dashboard Header Bar with Direct Link to Yearly Leave Ledger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div 
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'ALL')}
              className="cursor-pointer group/hdr hover:opacity-90 transition-opacity"
              title="클릭 시 내 1년차 연차대장 전체 상세내역으로 바로 이동합니다"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 group-hover/hdr:border-blue-400">
                  <span>{activeCycle.cycleIndex}년차 연차 현황 (대시보드)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover/hdr:translate-x-0.5 transition-transform" />
                </span>
                {activeCycle.isCurrent && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>현재 주기</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 mt-1.5 tracking-tight group-hover/hdr:text-blue-700 transition-colors flex items-center gap-1.5">
                <span>{activeCycle.startDate.replace(/-/g, '.')} ~ {activeCycle.endDate.replace(/-/g, '.')}</span>
                <span className="text-slate-400 font-normal text-xs sm:text-sm">(1년간)</span>
                <span className="text-xs font-bold text-blue-600 underline opacity-0 group-hover/hdr:opacity-100 transition-opacity ml-1">상세 대장 보기 →</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'ALL')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs self-start sm:self-auto group active:scale-95"
              title="1년차 연차대장 전체 내역 보기"
            >
              <span>📋 내 1년 연차대장 상세 보기</span>
              <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* 4 Clean Metric Cards - Clickable cards with direct navigation */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 pt-5">
            {/* Metric 1: 1년 총 발생 연차 */}
            <div 
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'ALL')}
              className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:border-slate-400 hover:bg-slate-100/80 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all group"
              title="클릭 시 내 1년 연차대장 전체 상세내역으로 바로 이동합니다"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-slate-700 text-xs sm:text-sm font-bold">
                    1년 총 발생 연차
                  </p>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {totalGranted}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-slate-500">일</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <p className="text-xs text-slate-600 font-medium">
                  기본 {activeCycle.baseGranted || 0}일 {employee.extraGrantedDays ? `+ 가산 ${employee.extraGrantedDays}일` : ''}
                </p>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                  대장 보기 →
                </span>
              </div>
            </div>

            {/* Metric 2: 사용한 연차 (승인) - Click navigates to 'APPROVED' filtered yearly ledger */}
            <div 
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'APPROVED')}
              className="p-4 sm:p-5 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:bg-blue-100/70 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all group"
              title="클릭 시 내 1년 연차대장의 '사용한 연차(승인 완료)' 내역으로 즉시 이동합니다"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-blue-900 text-xs sm:text-sm font-bold">
                    사용한 연차 (승인)
                  </p>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-800 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-blue-600">
                    {usedDays}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-blue-500">일</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-blue-200/70 flex items-center justify-between">
                <p className="text-xs text-blue-800 font-medium">
                  소진율 {usageRate}% (결재 완료)
                </p>
                <span className="text-[11px] font-bold text-blue-700 group-hover:text-blue-950 transition-colors">
                  대장 보기 →
                </span>
              </div>
            </div>

            {/* Metric 3: 결재 대기 연차 - Click navigates to 'PENDING' filtered yearly ledger */}
            <div 
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'PENDING')}
              className="p-4 sm:p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:bg-amber-100/70 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all group"
              title="클릭 시 내 1년 연차대장의 '결재 대기 연차' 내역으로 즉시 이동합니다"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-amber-900 text-xs sm:text-sm font-bold">
                    결제 대기 연차
                  </p>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-600">
                    {pendingDays}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-amber-500">일</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-amber-200/70 flex items-center justify-between">
                <p className="text-xs text-amber-800 font-medium">
                  {pendingDays > 0 ? `${pendingDays}일 결재 대기 중` : '대기 건 없음'}
                </p>
                <span className="text-[11px] font-bold text-amber-700 group-hover:text-amber-950 transition-colors">
                  대장 보기 →
                </span>
              </div>
            </div>

            {/* Metric 4: 미사용 잔여 연차 */}
            <div 
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'ALL')}
              className="p-4 sm:p-5 bg-emerald-50/70 rounded-2xl border border-emerald-300 flex flex-col justify-between cursor-pointer hover:border-emerald-600 hover:bg-emerald-100/70 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all group"
              title="클릭 시 내 1년 연차대장 전체 상세내역으로 이동합니다"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-emerald-900 text-xs sm:text-sm font-bold">
                    미사용 잔여 연차
                  </p>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
                    {remainingDays}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-emerald-500">일</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-emerald-200/80 flex items-center justify-between">
                <p className="text-xs text-emerald-800 font-semibold truncate">
                  ~ {activeCycle.endDate.replace(/-/g, '.')}
                </p>
                <span className="text-[11px] font-bold text-emerald-700 group-hover:text-emerald-950">
                  상세 보기 →
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. Recent Requests Section (최근 나의 연차 신청 및 사용 내역)  */}
      {/*    - 40~70대 맞춤 시원한 모바일 카드 리스트                       */}
      {/*    - 터치 시 큰 화면으로 상세 내역 팝업 오픈                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span>최근 연차 신청 및 사용 내역</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              최근 신청하신 연차의 승인 상태를 확인하실 수 있습니다. (카드를 터치하면 상세 내용이 열립니다)
            </p>
          </div>

          {activeCycle && (
            <button
              type="button"
              onClick={() => onViewYearlyDetail(activeCycle.cycleIndex, 'ALL')}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>📋 1년 연차대장 전체 보기</span>
              <ChevronRight className="w-4 h-4 text-blue-500" />
            </button>
          )}
        </div>

        {myRecentRequests.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">아직 등록된 연차 신청 내역이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">상단 '신규 연차 신청하기' 버튼을 눌러 휴가를 신청해보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRecentRequests.map((req) => {
              const isApproved = req.status === 'APPROVED';
              const isPending = req.status === 'PENDING';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  onClick={() => handleOpenDetailModal(req)}
                  className="p-4 bg-slate-50/70 hover:bg-blue-50/50 rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-2xs transition-all cursor-pointer active:scale-[0.99] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">
                        {getLeaveTypeLabel(req.type, req.daysCount)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                        {isPending && <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                        <span>{isApproved ? '승인완료' : isPending ? '결재대기' : '반려'}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-slate-900">
                        {req.daysCount}일
                      </span>
                      {req.type === 'HOURLY' && (
                        <span className="text-xs text-slate-500 block">({Math.round(req.daysCount * 8)}시간)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-bold flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>사용 기간:</span>
                    </span>
                    <strong className="text-slate-900 font-extrabold">
                      {req.startDate.replace(/-/g, '.')}
                      {req.startDate !== req.endDate ? ` ~ ${req.endDate.replace(/-/g, '.')}` : ' (당일)'}
                    </strong>
                  </div>

                  {req.reason && (
                    <p className="text-xs text-slate-600 line-clamp-1 px-1">
                      <span className="font-bold text-slate-700">사유:</span> {req.reason}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-700 flex items-center space-x-1 hover:underline">
                      <span>🔍 터치하여 상세 내역 보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex items-center space-x-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('이 연차 신청을 취소하시겠습니까?')) {
                              onCancelRequest(req.id);
                            }
                          }}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          신청취소
                        </button>
                      )}

                      {onOpenPrintModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPrintModal(req);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>인쇄</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave Detail Modal - 40~70대 맞춤 큼직한 상세 내역 팝업 모달 */}
      <LeaveDetailModal
        request={selectedDetailRequest}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenPrintModal={onOpenPrintModal}
      />
    </div>
  );
};
