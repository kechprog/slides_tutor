import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/theme.css";
import { SlideshowProvider, SettingsProvider, ThemeProvider } from "@/context";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SlideshowProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </SlideshowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
