import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CoupleCash — Finanzas en pareja, fácil y feliz",
  description: "Gestiona tus finanzas en pareja de forma simple y feliz con CoupleCash.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoupleCash",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#B2EBF2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-[var(--font-inter)]">{children}</body>
    </html>
  );
}
