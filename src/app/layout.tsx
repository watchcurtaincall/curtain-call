import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Newsletter } from "@/components/layout/Newsletter";
import { Footer } from "@/components/layout/Footer";
import { Providers } from '@/lib/Providers';
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.curtaincall.com.ng'),
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
      className={`${outfit.variable} h-full antialiased dark`}
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
        {/* Global SEO Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://curtaincall.com.ng/#website",
                  "url": "https://curtaincall.com.ng",
                  "name": "Curtain Call",
                  "description": "Discover, review, and archive African theatre productions.",
                  "publisher": {
                    "@id": "https://curtaincall.com.ng/#organization"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://curtaincall.com.ng/#organization",
                  "name": "Curtain Call",
                  "url": "https://curtaincall.com.ng",
                  "logo": "https://curtaincall.com.ng/og-default.png",
                  "sameAs": [
                    "https://twitter.com/curtaincall"
                  ]
                }
              ]
            })
          }}
        />
      </body>
    </html>
  );
}
