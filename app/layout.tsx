import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "StackHound - Discover the Tech Stack of Any GitHub Repository",
  description:
    "Analyze public GitHub repositories with StackHound to quickly identify the programming languages, frameworks, and tools used in their tech stack.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "StackHound - Discover the Tech Stack of Any GitHub Repository",
    description:
      "Analyze public GitHub repositories with StackHound to quickly identify the programming languages, frameworks, and tools used.",
    url: baseUrl,
    siteName: "StackHound",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackHound - Discover the Tech Stack of Any GitHub Repository",
    description:
      "Analyze public GitHub repositories with StackHound to quickly identify the programming languages, frameworks, and tools used.",
    creator: "@lorenzo_palaia",
  },
  keywords: [
    "GitHub",
    "repository",
    "tech stack",
    "analyzer",
    "detector",
    "dependencies",
    "Next.js",
    "React",
    "TypeScript",
    "developer tools",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
