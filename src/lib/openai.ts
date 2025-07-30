import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const sendMessage = async (content: string) => {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: content }],
    });
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export default openai;
