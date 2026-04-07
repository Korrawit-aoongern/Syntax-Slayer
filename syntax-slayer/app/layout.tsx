import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const ibmPlexThai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Syntax Slayer",
  description: "IT Vocabulary Matching Game for IT enthusiasts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
