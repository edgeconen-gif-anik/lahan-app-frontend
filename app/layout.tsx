import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Inter has no Devanagari glyphs; without this, Nepali text falls back to
// whatever each computer happens to have installed.
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lahan PMS",
  description: "Project Management System",
  icons: {
    icon: "/lahan_pms_fevicon.png",
    shortcut: "/lahan_pms_fevicon.png",
    apple: "/lahan_pms_fevicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoDevanagari.variable} font-sans antialiased`}>
        {/* 2. Providers wrap the entire app here */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
