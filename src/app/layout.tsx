import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";
import { UserProvider } from "@/lib/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gradabroad | Study Abroad Planner",
  description:
    "Plan your Germany study journey end-to-end: programs, shortlists, and application tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/gradabroad.png" type="image/png" />
        <meta property="og:image" content="/gradabroad.png" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="GradAbroad" />
        <meta property="og:description" content="Your global study abroad companion." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/gradabroad.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-zinc-900 antialiased dark:bg-black dark:text-white`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <Header />
            <main className="min-h-screen bg-white dark:bg-black">
              {children}
            </main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
