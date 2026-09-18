import ClientLayout from '@/components/client-layout';
import { Gamepad2, Sofa, Crown, UtensilsCrossed, Wifi, CalendarCheck, Clock, MapPin, Tag, ArrowRight, Users, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Gamepad2, title: 'Konsol Lengkap', desc: 'PS3, PS4, PS5 dengan koleksi game terbaru', emoji: '🎮' },
  { icon: Sofa, title: 'Ruangan Nyaman & Bersih', desc: 'AC dingin, kursi empuk, pencahayaan pas', emoji: '🛋️' },
  { icon: Crown, title: 'Ruang VIP — Lebih Privat', desc: 'Cocok untuk rombongan/keluarga', emoji: '👑' },
  { icon: UtensilsCrossed, title: 'Makanan & Minuman Segar', desc: 'Bisa dipesan langsung saat booking', emoji: '🍔' },
  { icon: Wifi, title: 'WiFi Cepat & Lengkap', desc: 'Koneksi internet ngebut untuk gaming online', emoji: '📶' },
  { icon: CalendarCheck, title: 'Booking Praktis', desc: 'Pilih tanggal & jam lewat HP, tercatat otomatis', emoji: '💻' },
];

const pricing = [
  { label: 'PS 3', price: 'Rp 5.000/jam' },
  { label: 'PS 4', price: 'Rp 10.000/jam' },
  { label: 'PS 5', price: 'Rp 15.000/jam' },
  { label: 'VIP', price: 'Rp 35.000/jam' },
];

const stats = [
  { icon: Gamepad2, value: '4', label: 'Jenis Konsol' },
  { icon: Clock, value: '16', label: 'Jam Buka/hari' },
  { icon: Users, value: '100+', label: 'Pelanggan Puas' },
  { icon: Trophy, value: '50+', label: 'Game Tersedia' },
];

export default function Home() {
  return (
    <ClientLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grid bg-radial-glow">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-glow-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-glow-pulse-soft" style={{ animationDelay: '1.5s' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-6 animate-float-up">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-primary/30 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Buka Sekarang — Bogor Barat
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Selamat Datang di{' '}
              <span className="text-neon">Line Up</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tempat terbaik untuk main, nongkrong, dan seru-seruan bareng teman!
              Konsol lengkap, ruangan nyaman, Bogor!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base hover:glow-neon glow-neon transition-all duration-300 hover:scale-105"
              >
                Booking Sekarang
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sewa-harian"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl glass-card text-foreground font-display font-semibold text-base border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                Sewa Harian
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-12">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="p-4 rounded-2xl glass-card border border-border/30 text-center animate-float-up"
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold font-display text-neon">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Zap className="h-3.5 w-3.5" />
            Keunggulan
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            <span className="text-neon">Kenapa Pilih Line Up?</span>
          </h2>
          <p className="text-muted-foreground mt-3">Pengalaman gaming terbaik di Bogor</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl glass-card border border-border/30 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] hover:glow-neon animate-float-up overflow-hidden"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start gap-4">
                <div className="shrink-0 p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors border border-primary/10 group-hover:border-primary/20">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hours & Pricing */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl glass-card border border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">Jam Buka</h3>
            </div>
            <p className="text-2xl font-bold text-neon-green">08:00 – 24:00</p>
            <p className="text-sm text-muted-foreground mt-1">Setiap hari</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/10">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">Harga Mulai</h3>
            </div>
            {pricing.map((p) => (
              <div key={p.label} className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span className="font-semibold text-primary">{p.price}</span>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl glass-card border border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">Lokasi</h3>
            </div>
            <p className="text-lg font-semibold">Bogor Barat</p>
            <p className="text-sm text-muted-foreground mt-1">Kota Bogor</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl glass-card border border-primary/20 p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 neon-border-flow rounded-full" />
          <div className="relative space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Siap untuk mulai main?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Booking tempat sekarang dan nikmati pengalaman gaming terbaik di Line Up Gaming Space.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold hover:glow-neon glow-neon transition-all duration-300 hover:scale-105"
            >
              Mulai Booking
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}
