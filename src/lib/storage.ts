import { supabase } from "./supabase/SupabaseClient";

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  filePath: string;
}

// 환경별 API 엔드포인트 설정
const getApiEndpoint = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:3000/api/download-image";
  }
  return "/api/download-image";
};

// URL에서 파일을 다운로드하여 Blob으로 변환 (CORS 우회)
export const downloadFileFromUrl = async (url: string): Promise<Blob> => {
  const maxRetries = 3;
  let lastError: Error | null = null;
  const apiEndpoint = getApiEndpoint();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `API 라우트를 통한 이미지 다운로드 시도 (${attempt}/${maxRetries}):`,
        url
      );

      // CORS 문제를 해결하기 위해 서버 사이드 프록시 사용
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      console.log(`API 응답 상태: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `API 라우트 응답 에러 (시도 ${attempt}):`,
          response.status,
          errorText
        );

        // 4xx 에러는 재시도하지 않음
        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `파일 다운로드 실패: ${response.statusText} - ${errorText}`
          );
        }

        // 5xx 에러는 재시도
        lastError = new Error(
          `서버 오류: ${response.statusText} - ${errorText}`
        );
        continue;
      }

      const blob = await response.blob();

      // Blob 유효성 검사
      if (blob.size === 0) {
        throw new Error("다운로드된 파일이 비어있습니다");
      }

      if (!blob.type.startsWith("image/")) {
        throw new Error(`잘못된 파일 타입: ${blob.type}`);
      }

      console.log(
        `API 라우트를 통한 다운로드 성공 (시도 ${attempt}):`,
        blob.size,
        "bytes",
        "타입:",
        blob.type
      );
      return blob;
    } catch (error) {
      console.error(`URL에서 파일 다운로드 중 오류 (시도 ${attempt}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // 지수 백오프
        console.log(`${delay}ms 후 재시도...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 모든 재시도 실패
  throw new Error(
    `이미지 다운로드 실패 (${maxRetries}회 시도): ${lastError?.message}`
  );
};

// Blob을 File 객체로 변환
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

// AI가 제공한 PDF 링크를 다운로드하여 Storage에 저장
export const uploadPdfFromUrl = async (
  pdfUrl: string,
  fileName: string = "ai-generated.pdf"
): Promise<UploadResult> => {
  try {
    // URL에서 PDF 파일 다운로드
    const blob = await downloadFileFromUrl(pdfUrl);

    // Blob을 File 객체로 변환
    const file = blobToFile(blob, fileName);

    // PDF 파일을 Storage에 업로드
    return await uploadFile(file, "pdf");
  } catch (error) {
    console.error("PDF 링크에서 파일 업로드 중 오류:", error);
    throw error;
  }
};

// AI가 생성한 이미지 URL을 다운로드하여 Storage에 저장
export const uploadImageFromUrl = async (
  imageUrl: string,
  fileName: string = "ai-generated.png"
): Promise<UploadResult> => {
  try {
    console.log("이미지 URL 다운로드 시작:", imageUrl);

    // 방법 1: API 라우트를 통한 다운로드 시도
    let blob: Blob;
    try {
      blob = await downloadFileFromUrl(imageUrl);
      console.log("API 라우트를 통한 다운로드 성공:", blob.size);
    } catch (apiError) {
      const apiErrorMessage =
        apiError instanceof Error ? apiError.message : String(apiError);
      console.warn("API 라우트 다운로드 실패, 직접 다운로드 시도:", apiError);

      // 방법 2: 직접 다운로드 시도 (CORS 허용된 경우)
      try {
        const response = await fetch(imageUrl, {
          mode: "cors",
          headers: {
            Accept: "image/*",
          },
        });

        if (!response.ok) {
          throw new Error(`직접 다운로드 실패: ${response.statusText}`);
        }

        blob = await response.blob();
        console.log("직접 다운로드 성공:", blob.size);
      } catch (directError) {
        const directErrorMessage =
          directError instanceof Error
            ? directError.message
            : String(directError);
        console.error("직접 다운로드도 실패:", directError);

        // 방법 3: 이미지 URL을 그대로 사용하고 Supabase에 URL만 저장
        console.warn("다운로드 실패, URL을 그대로 사용합니다.");
        throw new Error(
          `이미지 다운로드 실패: API 라우트(${apiErrorMessage}), 직접 다운로드(${directErrorMessage})`
        );
      }
    }

    console.log("다운로드된 Blob 크기:", blob.size);

    // Blob을 File 객체로 변환
    const file = blobToFile(blob, fileName);
    console.log("생성된 File 객체:", file.name, file.size, file.type);

    // 이미지 파일을 Storage에 업로드
    console.log("Supabase Storage 업로드 시작...");
    const result = await uploadFile(file, "png");
    console.log("업로드 완료:", result);

    return result;
  } catch (error) {
    console.error("이미지 URL에서 파일 업로드 중 오류:", error);
    throw error;
  }
};

// 파일을 Supabase Storage에 업로드
export const uploadFile = async (
  file: File,
  type: "pdf" | "png"
): Promise<UploadResult> => {
  try {
    console.log("업로드할 파일 정보:", file.name, file.size, file.type);

    // 파일 타입별 폴더 결정
    const folder = type === "pdf" ? "pdfs" : "imgs";
    console.log("사용할 폴더:", folder);

    // 고유한 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `gpt-generated/${folder}/${fileName}`;
    console.log("파일 경로:", filePath);

    // Supabase Storage에 업로드
    console.log("Supabase Storage 업로드 시도...");
    const { error } = await supabase.storage
      .from("gpt-generated")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage 업로드 에러:", error);
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    console.log("Supabase Storage 업로드 성공!");

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("gpt-generated")
      .getPublicUrl(filePath);

    const result = {
      fileUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath,
    };

    console.log("생성된 공개 URL:", result.fileUrl);
    return result;
  } catch (error) {
    console.error("파일 업로드 중 오류:", error);
    throw error;
  }
};

// 파일 타입 확인
export const getFileType = (file: File): "pdf" | "png" => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // 실제 PDF 파일인 경우
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  // PNG 파일 타입 (AI가 생성하는 파일 포함)
  if (fileType === "image/png" || fileName.endsWith(".png")) {
    return "png";
  }

  // 기본값은 png로 설정
  return "png";
};

// 파일 크기 제한 (10MB)
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 10
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// 지원되는 파일 타입 확인
export const isSupportedFileType = (file: File): boolean => {
  const supportedTypes = [
    "application/pdf",
    "image/png", // AI가 생성하는 PNG 파일
  ];

  return supportedTypes.includes(file.type.toLowerCase());
};
