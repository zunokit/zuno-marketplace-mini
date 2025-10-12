"use client";
import StoreProvider from "@/lib/store/StoreProvider";
import { WalletProvider } from "@/providers/WalletProvider";
import { Settings } from "lucide-react";
import { EnvConfigModal } from "@/components/features/env-config/EnvConfigModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);

  return (
    <StoreProvider>
      <WalletProvider>
        {/* Environment Config Button - Fixed Position */}
        <Button
          onClick={() => setIsEnvModalOpen(true)}
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
          aria-label="Configure Environment"
          title="Configure Environment Variables"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* Environment Config Modal */}
        <EnvConfigModal
          open={isEnvModalOpen}
          onOpenChange={setIsEnvModalOpen}
        />
        {children}
      </WalletProvider>
    </StoreProvider>
  );
}
