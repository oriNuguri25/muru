import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import KakaoLoginModal from "../../components/KakaoLoginModal";
import { useAuth } from "../../context/useAuth";

const MainPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLeftButtonClick = () => {
    // 동영상 생성 기능은 일시적으로 비활성화
    alert("동영상 생성 기능은 현재 준비 중입니다. 잠시만 기다려주세요.");
  };

  const handleRightButtonClick = () => {
    if (user) {
      // 로그인된 사용자는 채팅 페이지로 이동
      navigate(`/chat/png`);
    } else {
      // 로그인되지 않은 사용자는 로그인 모달 표시
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* 헤더 */}
      <Header />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-8 leading-tight">
            아이 맞춤 학습 자료를
            <br />
            쉽고 빠르게
          </h1>
        </div>

        <div className="flex justify-center space-x-6">
          <button
            onClick={handleLeftButtonClick}
            className="bg-gray-400 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-semibold text-lg shadow-lg cursor-not-allowed"
            disabled
          >
            아이 맞춤 동영상 자료 생성 (준비 중)
          </button>
          <button
            onClick={handleRightButtonClick}
            className="bg-white text-purple-400 border-2 border-purple-400 px-8 py-4 rounded-2xl hover:bg-purple-400 hover:text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
          >
            아이 맞춤 이미지 자료 생성
          </button>
        </div>
      </div>

      {/* 카카오 로그인 모달 */}
      <KakaoLoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default MainPage;
