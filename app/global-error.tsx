"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Application Error</h1>
              <p className="text-gray-600">
                A critical error occurred. Please refresh the page or contact support if the problem persists.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700 text-white">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}