import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import { CosmicShell } from "@/components/CosmicShell";
import { AuthDock } from "@/components/AuthDock";
import { AuthProvider } from "@/lib/auth-context";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Little Prince Digital Garden",
  description: "A poetic personal universe for notes, essays, games, and memory.",
  openGraph: {
    title: "Little Prince Digital Garden",
    description: "A poetic personal universe for notes, essays, games, and memory.",
    url: siteUrl(),
    siteName: "Little Prince Digital Garden",
    type: "website",
    locale: "zh_CN"
  },
  twitter: {
    card: "summary_large_image",
    title: "Little Prince Digital Garden",
    description: "A poetic personal universe for notes, essays, games, and memory."
  }
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
