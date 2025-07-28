import React from "react";
import KakaoIcon from "../../public/assets/kakao.svg?react";
import { KakaoLogin } from "../lib/supabase/KakaoLogin";

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KakaoLoginModal: React.FC<KakaoLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">로그인</h2>

          <div className="space-y-4">
            <button
              onClick={() => KakaoLogin()}
              className="w-full bg-yellow-400 text-black px-6 py-3 rounded-md hover:bg-yellow-500 transition-colors font-medium shadow-lg flex items-center justify-center space-x-2"
            >
              <KakaoIcon className="w-6 h-6" />
              <span>카카오로 로그인</span>
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KakaoLoginModal;
