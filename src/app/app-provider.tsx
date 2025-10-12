"use client";
import StoreProvider from "@/lib/store/StoreProvider";
import { WalletProvider } from "@/providers/WalletProvider";
import { EnvConfigModal } from "@/components/features/env-config/EnvConfigModal";
import { DraggableSettingsButton } from "@/components/common/DraggableSettingsButton";
import { useState } from "react";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);

  return (
    <StoreProvider>
      <WalletProvider>
        {/* Environment Config Button - Draggable */}
        <DraggableSettingsButton onClick={() => setIsEnvModalOpen(true)} />

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
