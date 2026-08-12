import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { RouteLoader } from "@/components/route-loader";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClassSphere - LMS",
  description: "Sistem Informasi Manajemen Tugas & Absensi",
  icons: {
    icon: "/class-sphere.png",
    shortcut: "/class-sphere.png",
    apple: "/class-sphere.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>
          <RouteLoader />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
