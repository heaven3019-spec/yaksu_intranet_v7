import React, { useState } from 'react';
import { Employee } from '../types';
import { Lock, KeyRound, Eye, EyeOff, CheckCircle2, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { saveEmployeeToFirestore } from '../lib/firebase';
import { changePasswordOnServer } from '../utils/storage';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmployee: Employee;
  onSuccess?: (updatedEmployee: Employee) => void;
  onPasswordUpdated?: (updatedEmployee: Employee) => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  targetEmployee,
  onSuccess,
  onPasswordUpdated,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPw = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPw) {
      setErrorMsg('새 비밀번호를 입력해주세요.');
      return;
    }

    if (cleanPw.length < 2) {
      setErrorMsg('비밀번호는 최소 2자리 이상 입력해주세요.');
      return;
    }

    if (cleanPw !== cleanConfirm) {
      setErrorMsg('비밀번호 확인이 일치하지 않습니다. 다시 확인해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedEmp: Employee = {
        ...targetEmployee,
        password: cleanPw,
      };

      // 1. Save directly to Cloud Firestore
      await saveEmployeeToFirestore(updatedEmp);

      // 2. Save to backend server DB
      await changePasswordOnServer(targetEmployee.id, cleanPw);

      if (onSuccess) {
        onSuccess(updatedEmp);
      }
      if (onPasswordUpdated) {
        onPasswordUpdated(updatedEmp);
      }

      onClose();
    } catch (err: any) {
      console.error('Password change error:', err);
      setErrorMsg(err?.message || '비밀번호 변경 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/30 rounded-xl text-blue-400 border border-blue-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">비밀번호 변경</h3>
              <p className="text-xs text-slate-300">
                {targetEmployee.name} ({targetEmployee.position}) · 아이디: <strong className="text-blue-300">{targetEmployee.loginId}</strong>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <p className="font-bold flex items-center space-x-1.5 mb-0.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>기본 비밀번호(1234)를 원하는 비밀번호로 변경하세요</span>
            </p>
            <p className="text-[11px] text-blue-800">
              변경 즉시 클라우드에 영구 저장되며, 다음 로그인부터 변경된 새 비밀번호로 접속하실 수 있습니다.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* New Password Input */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              새 비밀번호 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력 (예: 1234, 0410 등)"
                className="w-full pl-10 pr-11 py-3 text-sm sm:text-base font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? '비밀번호 가리기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              새 비밀번호 확인 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 한 번 더 입력"
                className="w-full pl-10 pr-4 py-3 text-sm sm:text-base font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>비밀번호 변경 완료</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
