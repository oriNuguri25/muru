import { useState } from "react";
import KakaoLoginModal from "./KakaoLoginModal";

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold text-gray-800">MURU</div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-gray-600 hover:text-purple-400 font-medium transition-colors">
                  Home
                </div>
                <div className="text-gray-600 hover:text-purple-400 font-medium transition-colors">
                  About
                </div>
              </div>
            </div>

            <button
              onClick={handleLoginClick}
              className="bg-purple-400 text-white px-6 py-2 rounded-md hover:bg-purple-500 transition-colors font-medium shadow-lg"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <KakaoLoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default Header;
