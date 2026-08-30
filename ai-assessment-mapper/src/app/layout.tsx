import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assessment AI",
  description: "AI-powered assessment extraction and answer mapping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}