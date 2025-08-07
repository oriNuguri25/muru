import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API 엔드포인트 호출됨:", req.method, req.url);

  // CORS 헤더 설정 - 더 포괄적으로 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // OPTIONS 요청 처리 (preflight)
  if (req.method === "OPTIONS") {
    console.log("OPTIONS 요청 처리");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("잘못된 HTTP 메서드:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("요청 바디 파싱 시작");
    const { url } = req.body;
    console.log("받은 URL:", url);

    if (!url) {
      console.log("URL이 제공되지 않음");
      return res.status(400).json({ error: "URL is required" });
    }

    // URL 유효성 검사
    try {
      new URL(url);
      console.log("URL 유효성 검사 통과");
    } catch {
      console.log("잘못된 URL 형식:", url);
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // 허용된 도메인 검사 (보안 강화)
    const allowedDomains = [
      "oaidalleapiprodscus.blob.core.windows.net",
      "oaidalleapiprodscus.blob.core.windows.net",
      "dalleprodscus.blob.core.windows.net",
    ];

    const urlObj = new URL(url);
    console.log("도메인 검사:", urlObj.hostname);

    if (!allowedDomains.some((domain) => urlObj.hostname.includes(domain))) {
      console.warn("허용되지 않은 도메인:", urlObj.hostname);
      return res.status(400).json({ error: "Unauthorized domain" });
    }

    console.log("다운로드 요청 URL:", url);

    // 서버 사이드에서 이미지 다운로드 - 더 안정적인 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("다운로드 타임아웃 발생");
    }, 30000); // 30초 타임아웃

    try {
      console.log("fetch 요청 시작");
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Vercel-Serverless/1.0)",
          Accept: "image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("fetch 응답 받음:", response.status, response.statusText);

      if (!response.ok) {
        console.error(
          "이미지 다운로드 실패:",
          response.status,
          response.statusText
        );
        return res.status(response.status).json({
          error: `Failed to fetch image: ${response.statusText}`,
        });
      }

      // Content-Type 확인
      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      if (!contentType || !contentType.startsWith("image/")) {
        console.error("잘못된 Content-Type:", contentType);
        return res.status(400).json({
          error: "Invalid content type - not an image",
        });
      }

      // 이미지 데이터를 클라이언트로 전송
      console.log("이미지 데이터 읽기 시작");
      const buffer = await response.arrayBuffer();
      console.log("이미지 데이터 읽기 완료:", buffer.byteLength, "bytes");

      console.log(
        "이미지 다운로드 성공:",
        contentType,
        buffer.byteLength,
        "bytes"
      );

      // 응답 헤더 설정
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", buffer.byteLength.toString());
      res.setHeader("Cache-Control", "public, max-age=3600");

      // 바이너리 데이터 전송
      console.log("응답 전송 시작");
      res.send(Buffer.from(buffer));
      console.log("응답 전송 완료");
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);

      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : "Unknown fetch error";
      res.status(500).json({
        error: "Failed to fetch image",
        details: errorMessage,
      });
    }
  } catch (error) {
    console.error("Image download error:", error);

    // 더 자세한 에러 정보 제공
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
}
