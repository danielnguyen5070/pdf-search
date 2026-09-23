"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocument, getDocuments, uploadDocument } from "@/lib/api/documents";
import { chatWithDocument } from "@/lib/api/chat";

export const documentKeys = {
  all: ["documents"] as const,
  detail: (id: string) => ["documents", id] as const,
};

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: getDocuments,
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useChat() {
  return useMutation({
    mutationFn: ({
      documentId,
      message,
    }: {
      documentId: string;
      message: string;
    }) => chatWithDocument(documentId, message),
  });
}
