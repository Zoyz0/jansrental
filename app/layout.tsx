import './globals.css';
import type { Metadata } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import { CartProvider } from '@/contexts/cart-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://lineupgamingspace.com'),
  title: 'Line Up Gaming Space — Rental PlayStation di Bogor',
  description: 'Tempat terbaik untuk main, nongkrong, dan seru-seruan bareng teman! Konsol lengkap, ruangan nyaman, di Bogor Barat.',
  openGraph: {
    title: 'Line Up Gaming Space — Rental PlayStation di Bogor',
    description: 'Konsol lengkap, ruangan nyaman, booking praktis lewat HP.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className="bg-background text-foreground font-body antialiased">
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
