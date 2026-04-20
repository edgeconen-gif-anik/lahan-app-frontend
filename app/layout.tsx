import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Using Inter font
import "./globals.css";
import { Providers } from "./providers"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lahan PMS",
  description: "Project Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 2. Providers wrap the entire app here */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
