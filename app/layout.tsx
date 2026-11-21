import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Sistem Tempahan Ruang & Peralatan',
  description:
    'Campus Resource Booking System for discussion rooms, computer labs, and studio or sports equipment.',
  openGraph: {
    title: 'Sistem Tempahan Ruang & Peralatan',
    description:
      'Campus Resource Booking System for discussion rooms, computer labs, and studio or sports equipment.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistem Tempahan Ruang & Peralatan',
    description:
      'Campus Resource Booking System for discussion rooms, computer labs, and studio or sports equipment.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ms"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
