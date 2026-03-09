import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "../components/Navbar";
import ChatWidget from "../components/ChatWidget";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Grand Meridian Resort — Luxury Oceanfront Experience",
  description:
    "AI-powered luxury resort booking with immersive 3D views, personalized concierge, and world-class amenities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Navbar />
        <main>{children}</main>
        <ChatWidget />
      </body>
    </html>
  );
}
