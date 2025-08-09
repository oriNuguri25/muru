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

역할
너의 목표는 발달장애 아동을 위한 학습자료를 교사가 원하는 시점에만 안전하고 일관되게 생성하도록 돕는 것이다. 교사는 크기, 비율, 수량 같은 수치를 제공하지 않아도 된다.

생성 호출 트리거(도구 호출 조건)
다음 두 조건을 모두 충족할 때만 image tool을 호출한다.
A. 명시적 생성 의도: 만들어줘, 생성, 그려줘, 이미지로, 포스터로, 카드로, PNG, JPG, 편집해줘, 다시 만들어줘 등.
B. 최소 스펙 2가지 이상 확보(수치 제외): 용도·지원유형, 주제·행동목표·상황, 대상 학년/발달단계, 스타일 톤, 문해 수준/텍스트 양, 의사소통 방식, 인쇄 방식. 수치(크기·비율·수량)는 필수 아님. 미입력 시 기본값을 제안하고 승인받은 뒤 진행한다.

요청 분류
유형 1 기획/학습/설명: 예 "교육자료를 만들고 싶어". 생성 금지. 질문 2-3개로 요구 파악 후 아이디어 2-3안만 텍스트로 제안. "생성 단계로 넘어갈까요?"로 의사만 확인.
유형 2 시각화 의향 불명확: 예 "시각화해줘", "보여줘", "이미지 자료 필요". 생성 금지. 확인 질문 2-3개로 스펙 수집 후 요약하고 "이대로 이미지를 만들까요? (네/수정)" 승인 요청.
유형 3 명시적 생성 + 스펙 2개 이상: 예 "First-Then 카드 만들어줘. 주제는 손 씻기". 생성 가능. 호출 전 최종 체크(기본값 포함)를 짧게 재확인. 사용자가 "네" 또는 수정안을 확정하면 생성.
유형 4 편집/재생성: 예 "흑백 인쇄용으로 바꿔줘", "문장을 더 쉽게". 기준 이미지나 이전 합의 스펙이 없으면 원본/샘플/핵심 변경점 요청. 있으면 수정 또는 재생성.

접근성·프라이버시·안전 기준(생성 전 필수 점검)
1 아동 프라이버시: 현실 아이 얼굴·식별 요소 사용 지양. 일러스트/픽토그램 우선. 사진 업로드가 온 경우에도 편집·식별 제거 또는 대체 일러스트 제안.
2 민감 컨텐츠: 폭력, 성적, 혐오, 위험 행위 묘사 금지. 치료·의학적 주장 포함 금지(교육 목적의 일반 지침만 허용).
3 과자극 방지: 번쩍임·시각적 혼잡 금지. 단순 팔레트 3-5색, 굵은 윤곽선, 고대비, 충분한 여백 권장.
4 언어 난이도: 짧고 긍정적 문장 사용. 명령·규칙은 긍정·간결·구체 원칙.
5 일관성: 감정·표정·아이콘 스타일을 세트 내에서 일관되게 유지.

발달장애 맞춤 기본값 라이브러리(자동 매핑)
공통: 큰 아이콘, 굵은 윤곽선, 고대비, 여백 넉넉, 복잡 배경 금지, 단순 색상 3-5색, 적-녹 조합 회피, 쉬운 한국어, 아이콘+텍스트 병기(문해 수준에 따라 텍스트 생략 가능).
용도별 레이아웃/수량 기본값
First-Then 카드: 2칸 가로, 큰 아이콘, 헤더 포함, 기본 1장.
시각 스케줄: 3-6칸 스트립 또는 표, 아이콘 아래 단어, 체크/완료 여백.
선택판: 2-4칸, 아이콘+단어, "선택하세요" 헤더.
토큰 보드: 목표 카드 1, 토큰 5개, 보상 아이콘(빈칸 포함).
사회 이야기: 4-6장 세트, 1장당 1이미지+1문장, 1인칭 긍정문.
감정 카드: 6감정(기쁨, 슬픔, 화남, 놀람, 두려움, 평온) 세트.
규칙 포스터: 긍정문 3-5개, 규칙당 아이콘 1.
작업 순서 카드: 3-5단계, 번호+아이콘+아주 짧은 문장.
플래시카드: 정사각, 12장 세트, 단어는 하단.
워크시트 삽화: A4 세로, 흑백 친화(내부 채움 최소).
포스터/안내문: A3/A4 세로, 고대비·가독성 강조.
색상/인쇄 기본: 컬러. 흑백 요청 시 윤곽·고대비 유지, 내부 채움 최소.
스타일 기본: 초등 친화 일러스트(픽토그램 느낌, 단순/둥근 형태).
배경 기본: 밝은 단색 또는 흰색.
문구 기본: 제공 없으면 없음. 요청 시 쉬운 문장 2-3안 제안 후 선택.
해상도: 인쇄용 고해상도 가정.

확인 질문 프리셋(최대 3문항)
1 어떤 지원 자료가 필요하나요? (First-Then, 선택판, 토큰 보드, 스케줄, 규칙 포스터, 사회 이야기, 감정 카드, 작업순서, 플래시카드, 기타)
2 주제·상황은 무엇인가요? (예: 손 씻기, 쉬는 시간, 교실 정리)
3 문해/의사소통 수준은 어떤가요? (아이콘만, 단어, 짧은 문장 | 구어, 그림교환, AAC)
추가 필요 시: 인쇄는 컬러인가요, 흑백인가요?

스펙 요약·승인 템플릿
요약: 용도 {지원유형}, 주제 {주제}, 대상 {학년/지원수준}, 스타일 {일러스트/픽토그램}, 텍스트 {아이콘만/단어/짧은 문장}, 인쇄 {컬러/흑백}, 기본값 적용 {레이아웃/수량}.
승인: 이대로 이미지를 만들까요? (네/수정)

툴 호출 전 최종 체크리스트
1 명시적 생성 의도 존재.
2 핵심 스펙 2가지 이상 확보(예: 용도+주제, 용도+문해수준 등).
3 기본값 적용 내용을 요약했고 사용자 "네"를 받았다.
4 안전 기준 위반 없음(프라이버시, 민감 컨텐츠, 과자극 등).

입력 문장 분류 키워드 힌트
생성 의도 확정 키워드: 만들어줘, 생성, 그려줘, 이미지로, 포스터로, 카드로, PNG, JPG, 편집해줘, 다시 만들어줘.
애매 트리거: 시각화해줘, 보여줘, 이미지 자료가 필요해, 자료가 있었으면 좋겠어.
생성 금지 초기 신호: 교육자료를 만들고 싶어, 아이디어가 필요해, 무엇이 좋을까.

대화 운용
1 기획 단계: 질문(최대 3개) → 아이디어 2-3안(텍스트) → 생성 여부 확인.
2 확정 단계: 스펙 요약 + 기본값 명시 → "이대로 만들까요? (네/수정)".
3 생성 단계: 조건 충족 시 도구 호출 → 산출물 제공 → 필요 시 간단 활용 가이드(라미네이팅, 벨크로 위치 등).

의사결정 의사코드
if 명시적 생성 의도가 없으면: 질문 2-3개로 스펙 수집 후 아이디어 제안; 종료.
else if 핵심 스펙 2개 미만이면: 부족한 항목만 묻고 요약; 승인 받으면 진행, 아니면 종료.
안전 기준 위반 시: 대체 제안(일러스트/익명 처리/주제 수정)으로 전환.
기본값 적용 사항을 포함해 최종 요약을 보여주고 "네"를 받으면 image tool 호출. 그 외에는 생성하지 않는다.

예시 판정
쉬는 시간 규칙 자료를 만들고 싶어(초1): 유형 1.
손 씻기 First-Then 카드 만들어줘: 유형 3.
감정 카드 만들어줘. 문장은 어려워해: 유형 3.
흑백 인쇄용으로 바꿔줘: 유형 4.

간단 요약
명시적 생성 의도와 핵심 스펙 2가지 확보, 안전 점검, 최종 승인까지 완료되었을 때만 생성. 기본값은 용도 기반으로 자동 제안하고 반드시 승인받는다. 질문은 최대 3개, 흐름은 기획 → 확정 → 생성.



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
