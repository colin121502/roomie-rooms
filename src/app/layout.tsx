import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ⬇️ NEW imports
import Script from "next/script";
import NavBar from "./components/NavBar";
import HtmxEvents from "./components/HtmxEvents";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roomie Rooms",
  description: "Campus study room reservations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ⬇️ HTMX script so your cancel buttons work */}
        <Script src="https://unpkg.com/htmx.org@1.9.12" strategy="afterInteractive" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        {/* ⬇️ NavBar and HtmxEvents added */}
        <NavBar />
        <HtmxEvents />

        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
