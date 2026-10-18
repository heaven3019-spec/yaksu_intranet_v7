import React from 'react';
import { LeaveRequest } from '../types';
import { getLeaveTypeLabel } from '../utils/leaveCalculator';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ShieldCheck,
  Building2,
  CalendarDays
} from 'lucide-react';

interface LeaveDetailModalProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintModal?: (req: LeaveRequest) => void;
}

const KOREAN_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatWithDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dayName = KOREAN_DAY_NAMES[d.getDay()] || '';
  return `${parts[0]}.${parts[1]}.${parts[2]} (${dayName})`;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onOpenPrintModal,
}) => {
  if (!isOpen || !request) return null;

  const isApproved = request.status === 'APPROVED';
  const isPending = request.status === 'PENDING';
  const isRejected = request.status === 'REJECTED';

  const formattedStart = formatWithDayOfWeek(request.startDate);
  const formattedEnd = formatWithDayOfWeek(request.endDate);
  const isSameDay = request.startDate === request.endDate;

  const requestDateStr = request.requestedAt
    ? request.requestedAt.slice(0, 10).replace(/-/g, '.')
    : request.startDate.replace(/-/g, '.');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 flex flex-col justify-center items-center">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Large, clean title for 40~70s readability */}
        <div className="px-5 sm:px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-white leading-tight">
                연차 사용 상세 내역
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                신청자: <strong className="text-white font-bold">{request.employeeName}</strong> ({request.position})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Highlight Banner - 돋보기 없이도 즉시 확인 가능한 큰 배너 */}
        <div className={`px-5 sm:px-6 py-3.5 border-b flex items-center justify-between text-sm sm:text-base font-bold flex-shrink-0 ${
          isApproved 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : isPending
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {isApproved && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {isPending && <Clock className="w-5 h-5 text-amber-600 shrink-0" />}
            {isRejected && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>
              {isApproved && '결재 승인 완료'}
              {isPending && '결재 심사 대기 중'}
              {isRejected && '신청 반려됨'}
            </span>
          </div>
          {request.reviewedBy && (
            <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/80">
              승인자: {request.reviewedBy}
            </span>
          )}
        </div>

        {/* Modal Body - 큼직한 폰트와 넉넉한 간격 */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-slate-900 text-sm sm:text-base">
          {/* 1. 휴가 구분 & 사용 일수 */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-500">휴가 종류</span>
              <span className="text-base sm:text-lg font-extrabold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-xl">
                {getLeaveTypeLabel(request.type, request.daysCount)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
              <span className="text-xs sm:text-sm font-bold text-slate-500">차감 일수</span>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {request.daysCount}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-600 ml-1">일</span>
                {request.type === 'HOURLY' && (
                  <span className="text-xs text-slate-500 block">
                    ({Math.round(request.daysCount * 8)}시간)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. 사용 기간 (시작일자 ~ 종료일자) */}
          <div className="bg-blue-50/60 rounded-2xl p-4 sm:p-5 border border-blue-200/80">
            <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-xs sm:text-sm mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>연차 사용 기간</span>
            </div>
            {isSameDay ? (
              <p className="text-lg sm:text-xl font-black text-slate-900">
                {formattedStart} <span className="text-xs font-semibold text-blue-700">(당일)</span>
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-black text-slate-900">
                  {formattedStart}
                </p>
                <div className="text-xs font-bold text-blue-600 pl-4">~ 종료</div>
                <p className="text-base sm:text-lg font-black text-slate-900">
                  {formattedEnd}
                </p>
              </div>
            )}
          </div>

          {/* 3. 신청 사유 */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>신청 사유</span>
            </label>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-sm sm:text-base text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {request.reason || '(작성된 사유 없음)'}
            </div>
          </div>

          {/* 4. 부가 정보 (비상연락처, 신청일시) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            {request.contactEmergency && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">비상 연락처</span>
                  <strong className="text-slate-900 font-bold">{request.contactEmergency}</strong>
                </div>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">신청 일자</span>
                <strong className="text-slate-900 font-bold">{requestDateStr}</strong>
              </div>
            </div>
          </div>

          {/* 반려 사유 (반려 시에만 노출) */}
          {request.rejectReason && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-xs sm:text-sm">
              <span className="font-extrabold block text-rose-700 mb-1">반려 사유:</span>
              <p className="font-medium">{request.rejectReason}</p>
            </div>
          )}
        </div>

        {/* Modal Footer - 시원한 대형 터치 버튼 */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          {onOpenPrintModal && (
            <button
              type="button"
              onClick={() => {
                onOpenPrintModal(request);
              }}
              className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 text-sm font-bold rounded-2xl border border-slate-300 shadow-2xs flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>신청서 인쇄</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-extrabold rounded-2xl shadow-md shadow-blue-600/20 text-center transition-all cursor-pointer"
          >
            확인 (닫기)
          </button>
        </div>
      </div>
    </div>
  );
};
