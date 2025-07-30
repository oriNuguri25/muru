import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { useChatSession } from "../../hooks/useChatSession";
import { useChatMessages } from "../../hooks/useChatMessages";

const ChatMain = () => {
  const navigate = useNavigate();
  const { type, sessionId } = useParams<{ type: string; sessionId?: string }>();
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);

  const {
    currentSession,
    userSessions,
    isLoadingSession,
    sessionError,
    createSession,
    isCreatingSession,
  } = useChatSession(type || "", sessionId);

  const {
    messages,
    isLoading: isLoadingMessages,
    addFirstMessage,
    sendUserMessage,
    sendFileMessage,
    generateFirstResponse,
    isGeneratingResponse,
    isUploadingFile,
  } = useChatMessages(sessionId);

  useEffect(() => {
    if (!["png", "pdf"].includes(type || "")) {
      // 잘못된 타입이면 리디렉션
      navigate("/");
      return;
    }

    // 세션 ID가 없으면 새 채팅 시작 모드로 설정
    if (!sessionId) {
      setIsStartingNewChat(true);
    }
  }, [type, sessionId, navigate]);

  // 새 채팅 시작 (첫 질문과 함께)
  const handleStartNewChat = async (firstQuestion: string) => {
    try {
      // 세션 생성
      const newSession = await createSession(firstQuestion);

      // 첫 메시지 추가 (사용자 질문)
      await addFirstMessage({
        sessionId: newSession.id,
        role: "user",
        type: "text",
        contents: firstQuestion,
      });

      // AI 답변 생성 및 저장 (새로 생성된 세션 ID 사용)
      await generateFirstResponse({
        sessionId: newSession.id,
        userMessage: firstQuestion,
      });

      setIsStartingNewChat(false);
    } catch (error) {
      console.error("새 채팅 시작 중 오류:", error);
    }
  };

  // 세션 로딩 중이거나 생성 중일 때
  if (isLoadingSession || isCreatingSession) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">세션을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 세션 에러가 있을 때
  if (sessionError) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            세션을 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-purple-400 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar type={type} sessions={userSessions} />
      <ChatWindow
        sessionId={sessionId}
        currentSession={currentSession}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isStartingNewChat={isStartingNewChat}
        onStartNewChat={handleStartNewChat}
        sendUserMessage={sendUserMessage}
        sendFileMessage={sendFileMessage}
        isGeneratingResponse={isGeneratingResponse}
        isUploadingFile={isUploadingFile}
        isCreatingSession={isCreatingSession}
        sessionType={type}
      />
    </div>
  );
};

export default ChatMain;
