import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MerchantSyncProvider } from "../components/MerchantSyncProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LokaPay",
  description: "Payment Without Borders",
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
        <MerchantSyncProvider>
          {children}
        </MerchantSyncProvider>
      </body>
    </html>
  );
}
