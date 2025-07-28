import Header from "../../components/Header";

const MainPage = () => {
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
          <button className="bg-purple-400 text-white px-8 py-4 rounded-2xl hover:bg-purple-500 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            아이 맞춤 학습 자료 생성
          </button>
          <div className="bg-white text-purple-400 border-2 border-purple-400 px-8 py-4 rounded-2xl hover:bg-purple-400 hover:text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            아이 맞춤 이미지 자료 생성
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
