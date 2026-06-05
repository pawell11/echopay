import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TanstackProvider } from "./providers";
import { Toaster } from "@vantagepay/ui";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  title: "VantagePay — Spend Crypto Like Real Money",
  description:
    "VantagePay is a Web3 virtual-card service on Solana. Issue a Mastercard in seconds and top it up with SOL, USDT, or $ECHO — funds settle to USD on the card balance instantly. No KYC up to $1k/month.",
  keywords: [
    "crypto virtual card",
    "Solana card",
    "crypto spending",
    "virtual Mastercard",
    "Web3 payments",
    "VantagePay",
    "$ECHO token",
    "crypto debit card",
    "no KYC card",
  ],
  authors: [{ name: "VantagePay" }],
  creator: "VantagePay",
  publisher: "VantagePay",
  metadataBase: new URL("https://vantagepay.cards"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vantagepay.cards",
    siteName: "VantagePay",
    title: "VantagePay — Spend Crypto Like Real Money",
    description:
      "Issue a virtual Mastercard in seconds. Top up with SOL, USDT, or $ECHO. Spend anywhere online. No KYC up to $1k/month. Built on Solana.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VantagePay — Spend Crypto Like Real Money",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VantagePay — Spend Crypto Like Real Money",
    description:
      "Issue a virtual Mastercard in seconds. Top up with SOL, USDT, or $ECHO. Spend anywhere online. No KYC up to $1k/month. Built on Solana.",
    images: ["/og-image.png"],
    creator: "@vantagepay",
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
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackProvider>
            {children}
            <Toaster />
          </TanstackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
