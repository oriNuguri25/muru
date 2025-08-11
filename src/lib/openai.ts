import OpenAI from "openai";
import { MURU_PROMPT, IMAGE_SYSTEM_PROMPT } from "./prompts";

// 브라우저에서 직접 호출할 거라면 CORS 대비 옵션 필요
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_PNG_API_KEY,
  dangerouslyAllowBrowser: true,
});

type ChatItem =
  | { type: "text"; content: string }
  | { type: "image"; base64: string; url?: string; mime?: string };

export type ChatResult = {
  responseId: string;
  items: ChatItem[];
};

/** 브라우저에서 base64 → Blob URL */
function base64ToObjectUrl(base64: string, mime = "image/png") {
  try {
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

/** Responses 출력 파싱(텍스트 + 이미지) */
function parseResponseOutput(resp: any): ChatItem[] {
  const items: ChatItem[] = [];

  // 1) 편의필드: output_text (있으면 우선 사용)
  if (resp.output_text && String(resp.output_text).trim()) {
    items.push({ type: "text", content: resp.output_text });
  }

  // 2) 세부 output 항목 순회(이미지 및 텍스트 보강)
  const out = Array.isArray(resp.output) ? resp.output : [];

  // 텍스트가 output_text로 오지 않는 경우를 대비 (message → content[].text)
  const textChunks: string[] = [];
  for (const o of out) {
    if (o.type === "message" && Array.isArray(o.content)) {
      for (const c of o.content) {
        if (c.type === "output_text" && c.text) textChunks.push(c.text);
        if (c.type === "text" && c.text) textChunks.push(c.text);
      }
    }
  }
  const merged = textChunks.join("\n").trim();
  if (merged && !items.some((i) => i.type === "text")) {
    items.push({ type: "text", content: merged });
  }

  // 이미지: image_generation_call → result(base64)
  for (const o of out) {
    if (o.type === "image_generation_call" && o.result) {
      const base64 = o.result as string;
      const url =
        typeof window !== "undefined" ? base64ToObjectUrl(base64) : undefined;
      items.push({ type: "image", base64, url, mime: "image/png" });
    }
  }

  // (가끔 바로 image 타입으로 올 수도 있음 – 안전망)
  for (const o of out) {
    if (o.type === "image" && o.image?.data) {
      const base64 = o.image.data as string;
      const mime = o.image.mime_type || "image/png";
      const url =
        typeof window !== "undefined"
          ? base64ToObjectUrl(base64, mime)
          : undefined;
      items.push({ type: "image", base64, url, mime });
    }
  }

  return items;
}

/**
 * 멀티턴 대화/이미지 생성 메인 함수
 * - 모델: gpt-5
 * - tools: image_generation
 * - instructions: (MURU_PROMPT + 이미지 정책) → 조건 만족 시에만 이미지 툴콜
 * - previousResponseId: 직전 응답 ID를 넣으면 컨텍스트가 이어짐
 */
export async function sendMessageWithImages(
  message: string,
  previousResponseId?: string
): Promise<ChatResult> {
  const resp = await openai.responses.create({
    model: "gpt-5-mini",
    // 시스템 역할 프롬프트: 너가 가진 정책 프롬프트들을 여기에 결합
    instructions: [
      MURU_PROMPT, // 네가 쓰던 메인 운영 프롬프트
      IMAGE_SYSTEM_PROMPT ?? "", // 이미지 생성 가드레일(조건 충족 시에만 툴콜 등)
      // 예: "Only call the image_generation tool when the user explicitly asks to create an image and at least 2 key specs are known. When calling the tool, bake in the constraints: pastel 3-4 colors, minimal background, no sensory overload, flat kid-friendly illustrations, etc. If specs are missing, ask up to 3 short questions first."
    ]
      .filter(Boolean)
      .join("\n\n"),
    input: message,
    tools: [{ type: "image_generation" }],
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
  });

  const items = parseResponseOutput(resp);
  return { responseId: resp.id, items };
}

/** 사용 예시
 *
 * let lastId: string | undefined;
 *
 * // 1턴
 * const r1 = await sendMessageWithImages("손 씻기 First-Then 카드 만들어줘. 컬러 인쇄예요.");
 * lastId = r1.responseId;
 * // r1.items 안에 텍스트/이미지 섞여 올 수 있음
 *
 * // 2턴(멀티턴) - "조금 더 크게 / 흑백으로 / 문장 제거" 등 수정
 * const r2 = await sendMessageWithImages("흑백 인쇄용으로 바꿔줘. 내부 채움 줄여줘.", lastId);
 * lastId = r2.responseId;
 */

/** (선택) 텍스트만 필요할 때 */
export async function sendTextOnly(
  message: string,
  previousResponseId?: string
): Promise<ChatResult> {
  const resp = await openai.responses.create({
    model: "gpt-5-mini",
    instructions: MURU_PROMPT,
    input: message,
    // tools 미지정 → 절대 이미지 생성 안 함
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
  });
  const items = parseResponseOutput(resp).filter((i) => i.type === "text");
  return { responseId: resp.id, items };
}
