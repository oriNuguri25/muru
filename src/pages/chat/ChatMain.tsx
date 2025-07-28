import { Bot, Home, Send, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sampleMessages = [
  {
    role: "user",
    content: "초등학교 3학년 수준으로 태양계에 대해 설명해주세요.",
  },
  {
    role: "assistant",
    content:
      "안녕하세요! 태양계에 대해 쉽게 설명해드릴게요.\n\n태양계는 태양을 중심으로 여러 행성들이 돌고 있는 우주 공간이에요. 태양은 아주 큰 별이고, 8개의 행성이 태양 주위를 돌고 있어요.\n\n행성들을 순서대로 말하면:\n1. 수성 - 태양에서 가장 가까워요\n2. 금성 - 아주 뜨거워요\n3. 지구 - 우리가 살고 있는 행성이에요\n4. 화성 - 빨간색이에요\n5. 목성 - 가장 커요\n6. 토성 - 예쁜 고리가 있어요\n7. 천왕성 - 옆으로 누워서 돌아요\n8. 해왕성 - 파란색이에요",
  },
  {
    role: "user",
    content: "지구는 왜 생명체가 살 수 있나요?",
  },
  {
    role: "assistant",
    content:
      "좋은 질문이에요! 지구에 생명체가 살 수 있는 이유는 여러 가지가 있어요:\n\n🌡️ **적당한 온도**: 태양으로부터 너무 가깝지도, 너무 멀지도 않은 거리에 있어서 물이 얼지도 않고 끓지도 않아요.\n\n💧 **물이 있어요**: 바다, 강, 호수에 액체 상태의 물이 많이 있어요. 모든 생명체는 물이 필요해요.\n\n🌬️ **공기(대기)가 있어요**: 우리가 숨쉬는 산소와 식물이 필요한 이산화탄소가 있어요.\n\n🛡️ **대기가 우리를 보호해요**: 해로운 우주 방사선을 막아주고, 운석이 떨어지는 것도 막아줘요.\n\n이런 조건들이 모두 갖춰져서 지구는 생명체가 살기에 완벽한 행성이 되었답니다!",
  },
];

const ChatMain = () => {
  const navigate = useNavigate();

  const handleMuruClick = () => {
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <button
            onClick={handleMuruClick}
            className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg transition-colors w-full cursor-pointer"
          >
            <div className="text-xl ml-2.5 font-bold text-gray-800">MURU</div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <nav className="space-y-2">
              <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer">
                <Home className="w-5 h-5 text-gray-600" />
                <div className="text-gray-700 font-medium">홈</div>
              </button>
            </nav>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 px-3">
                내 대화 기록
              </h3>
              <div className="space-y-1">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="text-gray-700 text-sm truncate block">
                    chat
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100  transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-gray-700 font-medium">유저 이름</div>
          </button>
        </div>
      </div>

      {/* 메인 화면 */}
      <div className="flex-1 flex flex-col h-full">
        {/* chat header */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">학습 자료 생성</h1>
          <div className="text-gray-600 mt-1">
            아이에게 맞는 맞춤형 학습 자료를 생성해보세요.
          </div>
        </div>

        {/* chat message */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {sampleMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start space-x-3 max-w-[80%] ${
                  message.role === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" ? "bg-purple-400" : "bg-gray-200"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-purple-400 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border-t border-gray-200 p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="메시지를 입력하세요"
                className="flex-1 p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <button className="bg-purple-400 text-white p-4 rounded-2xl hover:bg-purple-500 transition-colors shadow-lg flex-shrink-0 cursor-pointer">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMain;
