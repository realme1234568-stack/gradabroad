import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationProvider from "@/components/NotificationProvider";
import Header from "@/components/Header";
import LegalConsentProvider from "@/components/LegalConsentProvider";
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
  metadataBase: new URL("https://www.gradabroad.online"),
  title: "GradAbroad | Study Abroad Planner",
  description:
    "Plan your Germany study journey end-to-end: programs, shortlists, and application tracking.",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website", siteName: "GradAbroad", title: "GradAbroad | Study Abroad Planner",
    description: "Find programmes and plan your studies in Germany.",
    images: [{ url: "/brand/gradabroad-social-card.png", width: 1200, height: 630, alt: "GradAbroad — plan your studies in Germany" }],
  },
  twitter: { card: "summary_large_image", title: "GradAbroad", description: "Find programmes and plan your studies in Germany.", images: ["/brand/gradabroad-social-card.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <UserProvider>
            <NotificationProvider>
            <LegalConsentProvider>
            <Header />
            <main className="app-main">
              {children}
            </main>
            </LegalConsentProvider>
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
