import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionNavbar } from "@/components/session-navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "StudyMate AI — Universal College Reviewer Platform",
  description: "Study, review, and prepare for college exams with AI-powered tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground font-sans antialiased">
        <ThemeProvider defaultTheme="system">
          <SessionNavbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
