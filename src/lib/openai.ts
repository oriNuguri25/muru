import OpenAI from "openai";

// PDF용 OpenAI 클라이언트
const openaiPdf = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_PDF_API_KEY,
  dangerouslyAllowBrowser: true,
});

// PNG용 OpenAI 클라이언트
const openaiPng = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_PNG_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const sendMessage = async (
  message: string,
  chatType?: "pdf" | "png"
) => {
  // 채팅 타입에 따라 다른 API 키 사용
  const client = chatType === "pdf" ? openaiPdf : openaiPng;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    max_tokens: chatType === "pdf" ? 2000 : 1000,
    temperature: chatType === "pdf" ? 0.7 : 0.8,
  });

  return response;
};
