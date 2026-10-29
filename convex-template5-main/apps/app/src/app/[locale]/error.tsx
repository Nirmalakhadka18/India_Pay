"use client";

import { Button } from "@v1/ui/button";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-secondary px-6 text-center dark:bg-black">
      <h1 className="font-mono text-lg font-medium text-primary">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-primary/60">
        An unexpected error occurred. You can try again, or head back to the
        dashboard.
      </p>
      {error && (
        <pre className="max-w-2xl text-left bg-destructive/10 text-destructive p-4 rounded text-xs overflow-auto font-mono max-h-60 border border-destructive/20">
          {error.message || String(error)}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Go home
        </Button>
      </div>
    </div>
  );
}
