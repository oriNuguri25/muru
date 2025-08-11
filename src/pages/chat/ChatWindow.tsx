import { Bot, Send, User, Upload, X, Download } from "lucide-react";
import { useState, useRef } from "react";

interface ChatSession {
  id: string;
  user_id: string;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  type: "text" | "png" | "pdf";
  contents: string;
  file_url?: string;
  created_at: string;
}

interface ChatWindowProps {
  sessionId?: string;
  currentSession?: ChatSession | null;
  messages?: ChatMessage[];
  isLoadingMessages?: boolean;
  isStartingNewChat?: boolean;
  onStartNewChat?: (firstQuestion: string) => Promise<void>;
  sendUserMessage?: (content: string) => Promise<void>;
  sendFileMessage?: (
    file: File,
    contents?: string,
    sessionType?: string
  ) => Promise<void>;
  isGeneratingResponse?: boolean;
  isUploadingFile?: boolean;
  isCreatingSession?: boolean;
  isFirstResponseLoading?: boolean;
  sessionType?: string; // URL 경로의 pdf 또는 png
  isGeneratingImage?: boolean; // 이미지 생성 중인지 확인
}

const ChatWindow = ({
  sessionId,
  messages = [],
  isLoadingMessages = false,
  isStartingNewChat = false,
  onStartNewChat,
  sendUserMessage,
  sendFileMessage,
  isGeneratingResponse = false,
  isUploadingFile = false,
  isCreatingSession = false,
  isFirstResponseLoading = false,
  sessionType,
  isGeneratingImage = false,
}: ChatWindowProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;

    if (isStartingNewChat && onStartNewChat) {
      await onStartNewChat(inputMessage.trim());
      setInputMessage("");
    } else if (selectedFile && sendFileMessage) {
      // 파일 메시지 전송
      try {
        await sendFileMessage(
          selectedFile,
          fileDescription || inputMessage.trim(),
          sessionType
        );
        setSelectedFile(null);
        setFileDescription("");
        setInputMessage("");
      } catch (error) {
        console.error("파일 전송 실패:", error);
      }
    } else if (sendUserMessage) {
      // 텍스트 메시지 전송
      try {
        await sendUserMessage(inputMessage.trim());
        setInputMessage("");
      } catch (error) {
        console.error("메시지 전송 실패:", error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setInputMessage("");
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFileDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-start space-x-3 max-w-[80%] ${
          message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
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
            {message.contents}
          </div>
          {message.file_url && (
            <div className="mt-2">
              {message.type === "png" ? (
                <div className="relative inline-block">
                  {/* 디버깅 정보 (개발 환경에서만 표시) */}
                  {import.meta.env.DEV && (
                    <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                      이미지 URL: {message.file_url}
                    </div>
                  )}
                  <img
                    src={message.file_url}
                    alt="업로드된 이미지"
                    className="max-w-full max-h-64 rounded-lg"
                    onError={(e) => {
                      console.error("이미지 로딩 실패:", message.file_url);
                      const target = e.target as HTMLImageElement;

                      // QUIC 프로토콜 오류인지 확인
                      if (target.src && target.src.includes("supabase.co")) {
                        console.log("Supabase 이미지 로딩 실패, 재시도 중...");

                        // 잠시 후 재시도
                        setTimeout(() => {
                          target.src = target.src + "?retry=" + Date.now();
                        }, 1000);

                        return; // 재시도 중이므로 에러 메시지 표시하지 않음
                      }

                      target.style.display = "none";

                      // base64 데이터가 있는지 확인
                      if (
                        message.file_url &&
                        message.file_url.startsWith("data:")
                      ) {
                        console.log("base64 이미지 데이터가 있습니다");
                      }

                      // 에러 메시지 표시
                      const errorDiv = document.createElement("div");
                      errorDiv.className =
                        "text-red-500 text-sm p-2 bg-red-50 rounded";
                      errorDiv.textContent = "이미지를 불러올 수 없습니다.";
                      target.parentNode?.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log("이미지 로딩 성공:", message.file_url);
                    }}
                  />
                  <button
                    onClick={async () => {
                      try {
                        // 이미지 URL에서 파일 다운로드
                        const response = await fetch(message.file_url!);
                        if (!response.ok) {
                          throw new Error("이미지 다운로드 실패");
                        }

                        // Blob으로 변환
                        const blob = await response.blob();

                        // 다운로드 링크 생성
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `image-${Date.now()}.png`;

                        // 다운로드 실행
                        document.body.appendChild(link);
                        link.click();

                        // 정리
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("이미지 다운로드 중 오류:", error);
                        alert("이미지 다운로드에 실패했습니다.");
                      }
                    }}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    title="이미지 다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  📄 PDF 파일 보기
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* chat header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">
          {sessionType === "png"
            ? "아이에게 맞는 맞춤형 이미지 자료를 생성해보세요."
            : "아이에게 맞는 맞춤형 학습 자료를 생성해보세요."}
        </h1>
        <div className="text-gray-600 mt-1">
          {sessionType === "png" ? "이미지 자료 생성" : "학습 자료 생성"}
        </div>
      </div>

      {/* chat message */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoadingMessages ? (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map(renderMessage)}
            {(isGeneratingResponse || isUploadingFile || isCreatingSession) && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-[80%]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                    <Bot className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-200">
                    {isGeneratingImage ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-purple-600">
                          🎨 이미지를 생성중입니다...
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <span className="text-sm text-gray-600 ml-2">
                          응답을 생성중입니다...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            {sessionId ? "" : "첫 자료 생성을 시작해보세요."}
          </div>
        )}

        {/* 첫 질문 시 로딩 상태 표시 */}
        {isStartingNewChat &&
          (isGeneratingResponse ||
            isUploadingFile ||
            isCreatingSession ||
            isFirstResponseLoading) && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200">
                  {isGeneratingImage ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-purple-600">
                        🎨 이미지를 생성중입니다...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <span className="text-sm text-gray-600 ml-2">
                        응답을 생성중입니다...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* 파일 선택 영역 */}
      {selectedFile && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  {selectedFile.type.includes("pdf") ? (
                    <span className="text-purple-600 text-sm">📄</span>
                  ) : (
                    <span className="text-purple-600 text-sm">🖼️</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleFileRemove}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-t border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isStartingNewChat
                  ? "첫 번째 질문을 입력하세요..."
                  : selectedFile
                  ? "파일에 대한 설명을 입력하세요 (선택사항)"
                  : "메시지를 입력하세요"
              }
              disabled={isGeneratingResponse || isUploadingFile}
              className="flex-1 p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGeneratingResponse || isUploadingFile}
              className="bg-gray-100 text-gray-600 p-4 rounded-2xl hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg flex-shrink-0 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={
                (!inputMessage.trim() && !selectedFile) ||
                isGeneratingResponse ||
                isUploadingFile
              }
              className="bg-purple-400 text-white p-4 rounded-2xl hover:bg-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg flex-shrink-0 cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
