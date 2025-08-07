import OpenAI from "openai";
import { MURU_PROMPT, DALL_E_PROMPT } from "./prompts";

// PNG용 OpenAI 클라이언트
const openaiPng = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_PNG_API_KEY,
  dangerouslyAllowBrowser: true,
});

// GPT-4o가 이미지 생성이 필요한지 판단
const shouldGenerateImage = async (
  message: string,
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<boolean> => {
  const messages = [
    {
      role: "system" as const,
      content: `사용자의 요청이 이미지 생성이 필요한지 판단해주세요.

이미지 생성이 필요한 경우:
- "그려줘", "이미지로", "사진으로", "그림으로" 등의 표현
- "시각화해줘", "보여줘" 등의 표현
- 이미지가 필요한 상황 설명

이미지 생성이 필요하지 않은 경우:
- 일반적인 질문이나 설명 요청
- 텍스트 기반 정보 요청

'yes' 또는 'no'로만 답변하세요.`,
    },
    // 채팅 기록 추가
    ...(chatHistory || []),
    {
      role: "user" as const,
      content: message,
    },
  ];

  const response = await openaiPng.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 10,
    temperature: 0.1,
  });

  const answer = response.choices[0].message.content?.toLowerCase().trim();
  return answer === "yes";
};

// 이미지 프롬프트 생성
const generateImagePrompt = async (
  userInput: string,
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> => {
  const messages = [
    {
      role: "system" as const,
      content: `${DALL_E_PROMPT}

위의 가이드라인을 따라 사용자의 한국어 요청을 영어 이미지 생성 프롬프트로 변환해주세요.
이전 대화 맥락을 고려하여 구체적이고 상세한 묘사로 변환하세요.
반드시 영어로 답변하세요.`,
    },
    // 채팅 기록 추가
    ...(chatHistory || []),
    {
      role: "user" as const,
      content: userInput,
    },
  ];

  const response = await openaiPng.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? "";
};

// 이미지 생성
const generateImage = async (prompt: string): Promise<string> => {
  const response = await openaiPng.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    n: 1,
  });

  if (!response.data || response.data.length === 0) {
    throw new Error("이미지 생성에 실패했습니다.");
  }

  return response.data[0].url ?? "";
};

export const sendMessage = async (
  message: string,
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>
) => {
  // GPT-4o가 이미지 생성이 필요한지 판단
  const needsImage = await shouldGenerateImage(message, chatHistory);
  console.log("이미지 생성 필요 여부:", needsImage);

  if (needsImage) {
    try {
      // 1. 영어 이미지 프롬프트 생성 (채팅 기록 포함)
      const imagePrompt = await generateImagePrompt(message, chatHistory);
      console.log("생성된 이미지 프롬프트:", imagePrompt);

      // 2. DALL-E 3로 이미지 생성
      const imageUrl = await generateImage(imagePrompt);
      console.log("생성된 이미지 URL:", imageUrl);

      return {
        type: "image",
        url: imageUrl,
        prompt: imagePrompt, // 디버깅용으로 프롬프트도 반환
      };
    } catch (error) {
      console.error("이미지 생성 중 오류:", error);
      // 이미지 생성 실패 시 텍스트 응답으로 폴백
      return await sendTextMessage(message, chatHistory);
    }
  } else {
    // 일반 텍스트 응답
    return await sendTextMessage(message, chatHistory);
  }
};

// 텍스트 응답 처리
const sendTextMessage = async (
  message: string,
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>
) => {
  const messages = [
    {
      role: "system" as const,
      content: MURU_PROMPT,
    },
    // 채팅 기록 추가
    ...(chatHistory || []),
    {
      role: "user" as const,
      content: message,
    },
  ];

  const response = await openaiPng.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  });

  return {
    type: "text",
    content: response.choices[0].message.content,
  };
};
