import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EchoFrameProvider } from '@/lib/store';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EchoFrame | Multi-Agent Voice AI Orchestration for Events & Podcasts',
  description: 'Enterprise multi-agent voice AI operations platform powered by Bolna and Supabase. Coordinate specialized agents across speaker management, attendee support, scheduling, interviewing, and podcast production.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body
        className={`${inter.variable} ${inter.className} min-h-full flex flex-col font-sans`}
        style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}
      >
        <EchoFrameProvider>
          {children}
        </EchoFrameProvider>
      </body>
    </html>
  );
}
