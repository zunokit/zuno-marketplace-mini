"use client";
import type { ReactNode } from "react";
import StoreProvider from "@/lib/store/StoreProvider";
import { ZunoProvider, ZunoDevTools, WagmiProviderSync } from "zuno-marketplace-sdk/react";
import { defaultConfig, validateSDKConfig } from "@/lib/config/zuno-sdk";
import { logger } from "@/lib/utils/sdk-logger";

export default function AppProvider({
  children,
}: {
  children: ReactNode;
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
    <ZunoProvider config={defaultConfig}>
      <WagmiProviderSync
        reconnectDelay={500}
        clearOnDisconnect={true}
        onSync={() => logger.info("Wallet signer synced", { component: "WagmiProviderSync" })}
        onError={(error) => logger.error("Wallet sync error", error, { component: "WagmiProviderSync" })}
      />
      <StoreProvider>
        {children}
      </StoreProvider>
      {process.env.NODE_ENV === "development" && (
        <ZunoDevTools
          config={{
            showLogger: true,
            showTransactions: true,
            showCache: true,
            showNetwork: true,
            position: "bottom-right",
            defaultCollapsed: true,
          }}
        />
      )}
    </ZunoProvider>
  );
}