import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import AuthGatingProvider from "@/components/AuthGatingProvider";
import VoiceAssistantButton from "@/components/VoiceAssistantButton";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "MedOS Care | Find and book a doctor",
  description: "Find doctors, check available times, and book clinic or video visits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-slate-900"
        suppressHydrationWarning
      >
        <QueryProvider>
          <ThemeProvider>
            <AuthGatingProvider>
              {children}
              <VoiceAssistantButton />
            </AuthGatingProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
