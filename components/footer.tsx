import Link from 'next/link';
import { Instagram, Gamepad2, MapPin, Clock, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-neon">Line Up Gaming Space</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tempat terbaik untuk main, nongkrong, dan seru-seruan bareng teman di Bogor!
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Jam & Lokasi</h4>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Setiap hari, 08:00 – 24:00</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Bogor Barat, Kota Bogor</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Ikuti Kami</h4>
            <Link
              href="https://instagram.com/lineupgamingspace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-5 w-5" />
              @lineupgamingspace
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>© 2026 Line Up Gaming Space — Bogor. Semua Hak Dilindungi.</span>
            <Link href="/admin" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
              <Lock className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
