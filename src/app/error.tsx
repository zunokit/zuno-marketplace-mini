"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[app] route error", error);
    }
  }, [error]);

  return (
    <main
      className="flex items-center justify-center min-h-screen p-4 md:p-8"
      data-testid="error-page"
    >
      <div className="w-full max-w-xl space-y-6 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We hit an unexpected error while loading this page. You can try
            again or head back home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            onClick={() => reset()}
            data-testid="error-retry"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" data-testid="error-home">
            <Link href="/">Return home</Link>
          </Button>
        </div>

        {error.digest ? (
          <p
            className="pt-2 text-xs font-mono text-muted-foreground"
            data-testid="error-digest"
          >
            Error ID: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
