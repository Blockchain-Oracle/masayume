"use client";

import { diagnosis } from "@masayume/core";
import { ErrorState } from "@/components/states/ErrorState";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const technical = error.digest ? `${error.message} (digest ${error.digest})` : error.message;
  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-1 flex-col justify-center px-gutter py-section">
      <ErrorState variant="boundary" diagnosis={diagnosis("unknown", technical)} retry={reset} backHref="/markets" />
    </div>
  );
}
