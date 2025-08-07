import { supabase } from "./supabase/SupabaseClient";

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  filePath: string;
}

// URL에서 파일을 다운로드하여 Blob으로 변환
export const downloadFileFromUrl = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`파일 다운로드 실패: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error("URL에서 파일 다운로드 중 오류:", error);
    throw error;
  }
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
    // URL에서 이미지 파일 다운로드
    const blob = await downloadFileFromUrl(imageUrl);

    // Blob을 File 객체로 변환
    const file = blobToFile(blob, fileName);

    // 이미지 파일을 Storage에 업로드
    return await uploadFile(file, "png");
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
    // 파일 타입별 폴더 결정
    const folder = type === "pdf" ? "pdfs" : "imgs";

    // 고유한 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `gpt-generated/${folder}/${fileName}`;

    // Supabase Storage에 업로드
    const { error } = await supabase.storage
      .from("gpt-generated")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("gpt-generated")
      .getPublicUrl(filePath);

    return {
      fileUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath,
    };
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
