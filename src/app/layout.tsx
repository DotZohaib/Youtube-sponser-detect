import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  title: 'YouTube Sponsor Detector | AI Transcript Analysis',
  description: 'Find sponsored segments in YouTube videos using AI-powered transcript analysis.',
  keywords: ['YouTube', 'Sponsor Detector', 'Gemini AI', 'Ad Blocker', 'Transcript Analysis', 'Next.js'],
  authors: [{ name: 'YouTube Sponsor Detector' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500/30 selection:text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
