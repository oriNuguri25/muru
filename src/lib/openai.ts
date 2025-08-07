import OpenAI from "openai";
import { MURU_PROMPT } from "./prompts";

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
- "이미지 자료를 만들고 싶어", "그림 자료가 필요해" 등의 표현
- "다시 만들어줘", "다시 그려줘" 등의 표현
- 구체적인 이미지 요청 (예: "사회성 발달을 위한 이미지")

이미지 생성이 필요하지 않은 경우:
- 일반적인 질문이나 설명 요청
- 텍스트 기반 정보 요청
- 추상적인 요청 (예: "교육 자료가 필요해")

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
  console.log("이미지 생성 판단 결과:", answer);
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
      content: `Convert the Korean request to English image generation prompt for special education children.

Guidelines:
- Use soft pastel colors (3-4 colors max)
- Simple design with 5 or fewer elements
- No text in image
- Child-friendly illustration style
- Simple background
- Educational content

Examples:
- "강아지를 그려줘" → "A cute and friendly dog in soft pastel colors, simple design, no text, child-friendly illustration style"
- "친구와 함께 놀는 모습" → "Two children playing together happily, simple background, soft colors, no text, educational illustration"

Respond only with the English prompt, no explanations.`,
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

  const prompt = response.choices[0].message.content ?? "";
  console.log("생성된 영어 프롬프트:", prompt);
  return prompt;
};

// 이미지 생성
const generateImage = async (prompt: string): Promise<string> => {
  try {
    console.log("DALL-E 3에 전송할 프롬프트:", prompt);

    const response = await openaiPng.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      n: 1,
    });

    console.log("DALL-E 3 응답:", response);

    if (!response.data || response.data.length === 0) {
      throw new Error("이미지 생성에 실패했습니다.");
    }

    const imageUrl = response.data[0].url;
    console.log("생성된 이미지 URL:", imageUrl);

    return imageUrl ?? "";
  } catch (error) {
    console.error("DALL-E 3 이미지 생성 중 오류:", error);
    throw error;
  }
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
