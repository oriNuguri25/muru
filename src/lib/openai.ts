import OpenAI from "openai";
import { MURU_PROMPT } from "./prompts";

// PNG용 OpenAI 클라이언트
const openaiPng = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_PNG_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const sendMessage = async (message: string) => {
  const response = await openaiPng.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: MURU_PROMPT,
      },
      {
        role: "user",
        content: message,
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return response;
};
