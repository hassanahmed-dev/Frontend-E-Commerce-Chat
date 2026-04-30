"use client";

import { AuthProvider } from "@/lib/auth";
import { SupportChatWidget } from "@/components/chat/SupportChatWidget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SupportChatWidget />
    </AuthProvider>
  );
}

