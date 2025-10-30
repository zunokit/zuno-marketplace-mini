"use client";
import StoreProvider from "@/lib/store/StoreProvider";
import { WalletProvider } from "@/providers/WalletProvider";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </StoreProvider>
  );
}