import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/Providers";
import { ConnectButton } from "@/components/ConnectButton";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zuux Admin Panel",
  description: "Admin panel for Zuux ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1f17] text-white min-h-screen flex flex-col`}
      >
        <Providers>
          <header className="fixed top-0 w-full border-b border-[#1e3d2f]/50 bg-[#0f1f17]/90 backdrop-blur-md z-50">
            <div className="h-16 flex items-center justify-between px-6 pl-14 md:pl-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-[#4ade80] to-[#22c55e] rounded-lg shadow-lg shadow-green-500/20" />
                <h1 className="font-bold text-lg tracking-tight hidden sm:block">Zuux Admin</h1>
              </div>
              <ConnectButton />
            </div>
          </header>

          <div className="flex flex-1 pt-16">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-6 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-[#4ade80]/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative z-10 max-w-6xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
