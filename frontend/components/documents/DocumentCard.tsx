"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Document } from "@/types/api";
import { formatDate } from "@/lib/utils-app";

export function DocumentCard({ document }: { document: Document }) {
  const pagesLabel =
    document.page_count === 1
      ? "1 page"
      : `${document.page_count} pages`;

  return (
    <Link href={`/chat/${document.id}`} className="group block">
      <Card className="h-full transition-colors hover:border-foreground/20 hover:bg-muted/30">
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
          <p>{pagesLabel}</p>
          <p>{formatDate(document.created_at)}</p>
        </CardContent>
        <CardFooter>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">
            Open
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
