import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase/SupabaseClient";
import { sendMessageWithImages } from "../lib/openai";
import {
  uploadFile,
  uploadPdfFromUrl,
  uploadImageFromUrl,
  validateFileSize,
  isSupportedFileType,
} from "../lib/storage";

interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  type: "text" | "png" | "pdf";
  contents: string;
  file_url?: string;
  created_at: string;
}

export const useChatMessages = (sessionId?: string) => {
  const queryClient = useQueryClient();

  // 세션의 메시지 목록 조회
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chatMessages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!sessionId,
  });

  // 새 메시지 추가 (사용자 메시지)
  const addMessageMutation = useMutation({
    mutationFn: async ({
      role,
      type,
      contents,
      file_url,
    }: {
      role: "user" | "assistant";
      type: "text" | "png" | "pdf";
      contents: string;
      file_url?: string;
    }) => {
      if (!sessionId) throw new Error("세션이 없습니다.");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role,
          type,
          contents,
          file_url,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 세션의 updated_at 업데이트
      await supabase
        .from("sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return data as ChatMessage;
    },
    onSuccess: () => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
      // 세션 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    },
  });

  // 파일 업로드 및 메시지 생성
  const uploadFileAndCreateMessage = useMutation({
    mutationFn: async ({
      file,
      contents,
      sessionType,
    }: {
      file: File;
      contents: string;
      sessionType: string; // URL 경로의 pdf 또는 png
    }) => {
      if (!sessionId) throw new Error("세션이 없습니다.");

      // 파일 유효성 검사
      if (!isSupportedFileType(file)) {
        throw new Error("지원되지 않는 파일 타입입니다.");
      }

      if (!validateFileSize(file)) {
        throw new Error("파일 크기가 너무 큽니다. (최대 10MB)");
      }

      // URL 경로에 따른 타입 결정
      const messageType = sessionType === "pdf" ? "pdf" : "png";

      // 파일 업로드
      const uploadResult = await uploadFile(file, sessionType as "pdf" | "png");

      // 메시지 생성
      const { data, error } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role: "user",
          type: messageType,
          contents:
            contents ||
            `업로드된 ${sessionType === "pdf" ? "PDF" : "PNG"} 파일`,
          file_url: uploadResult.fileUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 세션의 updated_at 업데이트
      await supabase
        .from("sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return { message: data as ChatMessage, uploadResult };
    },
    onSuccess: () => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
      // 세션 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    },
  });

  // AI가 제공한 PDF 링크를 처리하는 함수
  const processAiPdfLink = useMutation({
    mutationFn: async ({
      pdfUrl,
      contents,
      fileName,
    }: {
      pdfUrl: string;
      contents: string;
      fileName?: string;
    }) => {
      if (!sessionId) throw new Error("세션이 없습니다.");

      // PDF 링크에서 파일 다운로드 및 업로드
      const uploadResult = await uploadPdfFromUrl(
        pdfUrl,
        fileName || "ai-generated.pdf"
      );

      // 메시지 생성
      const { data, error } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          type: "pdf",
          contents: contents,
          file_url: uploadResult.fileUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 세션의 updated_at 업데이트
      await supabase
        .from("sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return { message: data as ChatMessage, uploadResult };
    },
    onSuccess: () => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
      // 세션 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    },
  });

  // OpenAI 응답 생성 및 저장
  const generateResponseMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      if (!sessionId) throw new Error("세션이 없습니다.");

      // OpenAI에 메시지 전송 (이미지 생성 가능)
      const response = await sendMessageWithImages(userMessage);

      // 응답 아이템들을 순서대로 처리
      for (const item of response.items) {
        if (item.type === "image") {
          try {
            // base64 이미지를 Supabase Storage에 업로드
            const uploadResult = await uploadImageFromUrl(
              item.url ||
                `data:${item.mime || "image/png"};base64,${item.base64}`,
              `ai-generated-${Date.now()}.png`
            );

            // 이미지 응답 저장
            const { error } = await supabase.from("messages").insert({
              session_id: sessionId,
              role: "assistant",
              type: "png",
              contents: "생성된 이미지",
              file_url: uploadResult.fileUrl,
              created_at: new Date().toISOString(),
            });

            if (error) throw error;
          } catch (uploadError) {
            console.error("이미지 업로드 실패:", uploadError);
            // 업로드 실패 시 base64를 직접 저장
            const { error } = await supabase.from("messages").insert({
              session_id: sessionId,
              role: "assistant",
              type: "png",
              contents: "생성된 이미지 (base64)",
              file_url: `data:${item.mime || "image/png"};base64,${
                item.base64
              }`,
              created_at: new Date().toISOString(),
            });

            if (error) throw error;
          }
        } else if (item.type === "text") {
          // 텍스트 응답 저장
          const { error } = await supabase.from("messages").insert({
            session_id: sessionId,
            role: "assistant",
            type: "text",
            contents: item.content,
            created_at: new Date().toISOString(),
          });

          if (error) throw error;

          // PDF 링크 감지 (http/https로 시작하는 URL 중 .pdf로 끝나는 것)
          const pdfUrlMatch = item.content.match(/https?:\/\/[^\s]+\.pdf/gi);

          if (pdfUrlMatch && pdfUrlMatch.length > 0) {
            // PDF 링크가 있으면 PDF 파일을 다운로드하여 저장
            const pdfUrl = pdfUrlMatch[0];

            try {
              await processAiPdfLink.mutateAsync({
                pdfUrl,
                contents: "AI가 생성한 PDF 파일",
                fileName: `ai-generated-${Date.now()}.pdf`,
              });
            } catch (pdfError) {
              console.error("PDF 링크 처리 실패:", pdfError);
            }
          }
        }
      }

      // 세션의 updated_at 업데이트
      await supabase
        .from("sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    },
    onSuccess: () => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
      // 세션 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    },
  });

  // 사용자 메시지 전송 및 AI 응답 생성
  const sendUserMessage = async (content: string) => {
    try {
      // 사용자 메시지 저장
      await addMessageMutation.mutateAsync({
        role: "user",
        type: "text",
        contents: content,
      });

      // AI 응답 생성 및 저장
      await generateResponseMutation.mutateAsync(content);
    } catch (error) {
      console.error("메시지 전송 중 오류:", error);
      throw error;
    }
  };

  // 파일 업로드 및 AI 응답 생성
  const sendFileMessage = async (
    file: File,
    contents?: string,
    sessionType?: string
  ) => {
    try {
      // 파일 업로드 및 메시지 생성
      await uploadFileAndCreateMessage.mutateAsync({
        file,
        contents: contents || "",
        sessionType: sessionType || "png", // 기본값은 png (URL 경로)
      });

      // AI 응답 생성 및 저장 (파일 내용에 대한 설명 요청)
      const prompt = contents
        ? `다음 파일에 대한 질문: ${contents}\n파일: ${file.name}`
        : `이 ${
            sessionType === "pdf" ? "PDF" : "PNG"
          } 파일에 대해 설명해주세요.`;

      await generateResponseMutation.mutateAsync(prompt);
    } catch (error) {
      console.error("파일 메시지 전송 중 오류:", error);
      throw error;
    }
  };

  // AI가 제공한 PDF 링크 처리
  const handleAiPdfLink = async (
    pdfUrl: string,
    contents: string,
    fileName?: string
  ) => {
    try {
      await processAiPdfLink.mutateAsync({
        pdfUrl,
        contents,
        fileName,
      });
    } catch (error) {
      console.error("AI PDF 링크 처리 중 오류:", error);
      throw error;
    }
  };

  // 첫 메시지 추가 (세션 생성과 함께)
  const addFirstMessageMutation = useMutation({
    mutationFn: async ({
      sessionId,
      role,
      type,
      contents,
      file_url,
    }: {
      sessionId: string;
      role: "user" | "assistant";
      type: "text" | "png" | "pdf";
      contents: string;
      file_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role,
          type,
          contents,
          file_url,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 세션의 updated_at 업데이트
      await supabase
        .from("sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return data as ChatMessage;
    },
    onSuccess: () => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
      // 세션 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    },
  });

  // 새 세션에서 AI 답변 생성 (첫 질문에 대한 응답)
  const generateFirstResponseMutation = useMutation({
    mutationFn: async ({
      sessionId,
      userMessage,
    }: {
      sessionId: string;
      userMessage: string;
    }) => {
      // OpenAI에 메시지 전송 (첫 메시지이므로 채팅 기록 없음)
      const response = await sendMessageWithImages(userMessage);

      // 응답 아이템들을 순서대로 처리
      for (const item of response.items) {
        if (item.type === "image") {
          try {
            // base64 이미지를 Supabase Storage에 업로드
            console.log("Supabase Storage 업로드 시작...");
            const uploadResult = await uploadImageFromUrl(
              item.url ||
                `data:${item.mime || "image/png"};base64,${item.base64}`,
              `ai-generated-${Date.now()}.png`
            );
            console.log("업로드 결과:", uploadResult);

            // 이미지 응답 저장
            const { data, error } = await supabase
              .from("messages")
              .insert({
                session_id: sessionId,
                role: "assistant",
                type: "png",
                contents: "생성된 이미지",
                file_url: uploadResult.fileUrl,
                created_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) throw error;

            // 세션의 updated_at 업데이트
            await supabase
              .from("sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", sessionId);

            return data as ChatMessage;
          } catch (uploadError) {
            console.error("이미지 업로드 실패:", uploadError);
            console.log("원본 URL로 저장 시도...");
            // 업로드 실패 시 base64를 직접 저장
            const { data, error } = await supabase
              .from("messages")
              .insert({
                session_id: sessionId,
                role: "assistant",
                type: "png",
                contents: "생성된 이미지 (base64)",
                file_url: `data:${item.mime || "image/png"};base64,${
                  item.base64
                }`,
                created_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) throw error;

            // 세션의 updated_at 업데이트
            await supabase
              .from("sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", sessionId);

            return data as ChatMessage;
          }
        } else if (item.type === "text") {
          // 텍스트 응답 저장
          const { data, error } = await supabase
            .from("messages")
            .insert({
              session_id: sessionId,
              role: "assistant",
              type: "text",
              contents: item.content,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;

          // 세션의 updated_at 업데이트
          await supabase
            .from("sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", sessionId);

          return data as ChatMessage;
        }
      }
    },
    onSuccess: () => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ["chatMessages", sessionId] });
      // 세션 목록 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    addMessage: addMessageMutation.mutate,
    addFirstMessage: addFirstMessageMutation.mutate,
    generateFirstResponse: generateFirstResponseMutation.mutateAsync,
    sendUserMessage,
    sendFileMessage,
    handleAiPdfLink,
    isAddingMessage: addMessageMutation.isPending,
    isAddingFirstMessage: addFirstMessageMutation.isPending,
    isGeneratingResponse: generateResponseMutation.isPending,
    isUploadingFile: uploadFileAndCreateMessage.isPending,
    isProcessingPdfLink: processAiPdfLink.isPending,
    isGeneratingImage: generateResponseMutation.isPending,
  };
};
