"use client";

import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Document } from "@/types/api";
import { formatDate, formatFileSize } from "@/lib/utils-app";

export function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <CardTitle className="line-clamp-2 text-base font-medium leading-snug">
            {document.filename}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{formatFileSize(document.size)}</p>
        <p>{formatDate(document.created_at)}</p>
        <p className="truncate font-mono text-xs">{document.id}</p>
      </CardContent>
    </Card>
  );
}
