"use client";
import StoreProvider from "@/lib/store/StoreProvider";
import { ZunoProvider } from "zuno-marketplace-sdk/react";
import { validateSDKConfig } from "@/lib/config/zuno-sdk";
import { logger } from "@/lib/utils/logger";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate SDK configuration before initialization
  const validation = validateSDKConfig();

  if (!validation.isValid) {
    logger.error("Zuno SDK Configuration Error", validation.errors, {
      component: "AppProvider",
      action: "validateSDKConfig"
    });
    // In production, you might want to render a more user-friendly error page
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Configuration Error
          </h1>
          <p className="text-gray-600 mb-4">
            The application is not properly configured.
          </p>
          <details className="text-left text-sm text-gray-500">
            <summary>Error Details</summary>
            <ul className="list-disc list-inside mt-2">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    );
  }

  return (
    <ZunoProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
        network: (process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
          ? parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
          : 31337) as number,
        apiUrl: process.env.NEXT_PUBLIC_ZUNO_API_URL!,
        cache: {
          ttl: 300000, // 5 minutes
          gcTime: 600000, // 10 minutes
        },
        retryPolicy: {
          maxRetries: 3,
          backoff: 'exponential',
        },
        debug: process.env.NODE_ENV === 'development',
      }}
    >
      <StoreProvider>
        {children}
      </StoreProvider>
    </ZunoProvider>
  );
}