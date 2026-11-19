import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PJOKVerse SD - Dunia Belajar PJOK 3D",
  description: "Gim edukasi 3D interaktif Kurikulum Merdeka PJOK SD",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PJOKVerse SD",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}