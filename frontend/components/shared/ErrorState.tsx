"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/types/api";
import { getErrorMessage } from "@/lib/utils-app";

export function ErrorState({
  error,
  title = "Something went wrong",
  fallback = "Please try again.",
  onRetry,
  showBackLink = false,
}: {
  error?: unknown;
  title?: string;
  fallback?: string;
  onRetry?: () => void;
  showBackLink?: boolean;
}) {
  const isNotFound =
    error instanceof ApiError &&
    (error.code === "not_found" || error.status === 404);
  const isNetwork =
    error instanceof ApiError &&
    (error.code === "network" || error.status === 0);

  const message = getErrorMessage(
    error,
    isNotFound
      ? "Document not found."
      : isNetwork
        ? "Unable to connect to the server. Please make sure the backend is running."
        : fallback
  );

  const displayTitle = isNotFound
    ? "Document not found"
    : isNetwork
      ? "Unable to connect to the server"
      : title;

  const Icon = isNetwork ? WifiOff : AlertCircle;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
      <Alert variant="destructive" className="max-w-md">
        <Icon />
        <AlertTitle>{displayTitle}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="flex items-center gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
        {showBackLink && (
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Documents
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
