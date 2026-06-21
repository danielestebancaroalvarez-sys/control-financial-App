import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/notifications/service-worker-register";
import { getUserTheme } from "@/lib/profile/queries";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Couple Hub — Finanzas y tiempo en pareja",
  description:
    "Organiza finanzas, horarios, tareas y metas con tu pareja en Couple Hub.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Couple Hub",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#B2EBF2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getUserTheme();

  return (
    <html
      lang="es"
      className={`${inter.variable}${theme === "dark" ? " dark" : ""}`}
      style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <body className="font-[var(--font-inter)]">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
