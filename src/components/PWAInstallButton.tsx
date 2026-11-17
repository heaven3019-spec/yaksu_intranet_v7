import React, { useState } from 'react';
import { Download, Smartphone, X, Share, MoreVertical, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card' | 'login';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, isSamsungBrowser, promptInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === 'login' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full mt-3 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-blue-100 border border-blue-400/30 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
        >
          <Smartphone className="w-4 h-4 text-blue-300" />
          <span>갤럭시 / 스마트폰 홈 화면에 앱으로 추가</span>
        </button>
      ) : variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>홈 화면에 앱 추가</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          title="스마트폰 홈 화면에 앱으로 설치"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>앱 설치</span>
        </button>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">홈 화면에 앱 추가 안내</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900">아이폰 (Safari) 설치 방법:</p>
                  <ol className="space-y-2 list-decimal list-inside bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <li>
                      화면 하단의 <Share className="w-4 h-4 inline text-blue-600 mx-0.5" />{' '}
                      <strong>공유</strong> 버튼을 누릅니다.
                    </li>
                    <li>
                      메뉴에서 <strong>&quot;홈 화면에 추가&quot;</strong>를 선택합니다.
                    </li>
                    <li>
                      오른쪽 상단 <strong>&quot;추가&quot;</strong>를 누르면 바탕화면에 앱 아이콘이 생성됩니다.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900">
                    갤럭시 ({isSamsungBrowser ? '삼성 인터넷' : '크롬 / 삼성 인터넷'}) 설치 방법:
                  </p>
                  <ol className="space-y-2.5 list-decimal list-inside bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
                    <li>
                      브라우저 상단 <MoreVertical className="w-4 h-4 inline text-slate-700" />{' '}
                      <strong>메뉴(⋮)</strong> 또는 하단 <strong>줄 세개(≡)</strong> 메뉴를 누릅니다.
                    </li>
                    <li>
                      <strong>&quot;현재 페이지 추가 → 홈 화면&quot;</strong> 또는{' '}
                      <strong>&quot;앱 설치 / 홈 화면에 추가&quot;</strong>를 선택하세요.
                    </li>
                    <li>
                      홈 화면에 <strong>약수 연차관리</strong> 아이콘이 추가되며 일반 앱처럼 실행됩니다!
                    </li>
                  </ol>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start space-x-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  설치 후 로그인 화면 없이 바로 열리며, <strong>관리자 계정</strong>은 잠금화면/상단바 알림 설정도 이용할 수 있습니다.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
