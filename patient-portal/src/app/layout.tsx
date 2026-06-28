import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import AuthGatingProvider from "@/components/AuthGatingProvider";
import VoiceAssistantButton from "@/components/VoiceAssistantButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HealthCenter | Discover & Book Top-Rated Doctors Online",
  description: "Browse nearby healthcare providers, filter by specialty or ZIP code, and book in-person or virtual telehealth appointments securely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-slate-900 text-slate-100 selection:bg-teal-500 selection:text-slate-900"
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthGatingProvider>
            {children}
            <VoiceAssistantButton />
          </AuthGatingProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
