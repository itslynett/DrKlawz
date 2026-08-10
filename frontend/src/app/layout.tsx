import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Klawz Digital Business Journal",
  description: "A luxury offline-first PWA business journal and management console for nail technicians.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  themeColor: "#3E2723",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dr. Klawz Journal",
  },
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
