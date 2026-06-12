import type { Metadata } from "next";
import "./globals.css";
import { CosmicShell } from "@/components/CosmicShell";
import { AuthDock } from "@/components/AuthDock";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Little Prince Digital Garden",
  description: "A poetic personal universe for notes, essays, games, and memory."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <CosmicShell>
            <AuthDock />
            {children}
          </CosmicShell>
        </AuthProvider>
      </body>
    </html>
  );
}
