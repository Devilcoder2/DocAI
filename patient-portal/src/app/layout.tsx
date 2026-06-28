import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import AuthGatingProvider from "@/components/AuthGatingProvider";
import VoiceAssistantButton from "@/components/VoiceAssistantButton";
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-slate-900 text-slate-100 selection:bg-teal-500 selection:text-slate-900"
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
