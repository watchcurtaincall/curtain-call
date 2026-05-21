import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Newsletter } from "@/components/layout/Newsletter";
import { Footer } from "@/components/layout/Footer";
import { Providers } from '@/lib/Providers';
import "./globals.css";

const geist = {
  variable: "font-sans",
};

export const metadata: Metadata = {
  title: "Curtain Call | Digital Home for Theatre Culture in Africa",
  description: "Discover, review, and archive African theatre productions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Newsletter />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
