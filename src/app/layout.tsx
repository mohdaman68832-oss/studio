
import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'InnovateSphere | Share & Scale Your Ideas',
  description: 'The premier platform for innovators to share, analyze, and collaborate on groundbreaking ideas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <main className="pb-20 min-h-screen">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
