import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LokaPay | Borderless Payments & Instant Settlement",
    template: "%s | LokaPay",
  },
  description: "LokaPay is a hybrid payment infrastructure bridging the global crypto economy with the local real economy. We enable merchants to accept stable coin from international tourists with instant IDR settlement, eliminating high FX fees and currency friction.",
  keywords: [
    "LokaPay",
    "Crypto Payment Gateway",
    "USDT to IDR",
    "Stablecoin to IDR",
    "Borderless Payments",
    "Web3 POS",
    "Instant Settlement",
    "Hybrid Payment Infrastructure",
    "Gasless Transactions"
  ],

  authors: [{ name: "Aetherial Labs" }],
  creator: "LokaPay Team",
  publisher: "LokaPay",
  applicationName: "LokaPay",

  icons: {
    icon: '/logo/logoCircle.png',
  },

  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "LokaPay",
    description: "The seamless bridge between global crypto assets and local commerce. Tourists pay in USDT, merchants receive Rupiah instantly without high fees.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    images: [{ url: '/logo/logoWithText.png' }],
    siteName: "LokaPay",
    locale: "id-ID",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "LokaPay",
    description: "The seamless bridge between global crypto assets and local commerce. Tourists pay in USDT, merchants receive Rupiah instantly without high fees.",
    creator: "@lokapay",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${inter.variable} antialiased bg-background`}
      >
        {children}
      </body>
    </html>
  );
}
