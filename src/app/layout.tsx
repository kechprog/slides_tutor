import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SlideshowProvider, SettingsProvider } from "@/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Slides Tutor",
  description: "Present narrated slideshows with interactive tutorials",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SlideshowProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </SlideshowProvider>
      </body>
    </html>
  );
}
