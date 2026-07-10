import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarHeart,
    Check,
    Gift,
    Heart,
    Images,
    MapPin,
    Moon,
    Sparkles,
    Sun,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { formatRupiah } from '@/lib/format';
import { dashboard, login, register } from '@/routes';
import type { Package } from '@/types/invitation';

interface Props {
    packages: Package[];
}

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
    {
        icon: Sparkles,
        title: 'Self-serve 10 menit',
        body: 'Buat undangan sendiri lewat stepper 7 langkah tanpa perlu menghubungi admin.',
    },
    {
        icon: CalendarHeart,
        title: 'Tema adat & modern',
        body: 'Pilihan template Jawa, Sunda, Batak, hingga modern minimalis.',
    },
    {
        icon: Users,
        title: 'RSVP & ucapan',
        body: 'Tamu konfirmasi kehadiran dan kirim doa langsung dari undangan.',
    },
    {
        icon: Gift,
        title: 'Angpao digital',
        body: 'Terima hadiah lewat transfer bank dan e-wallet dengan satu klik salin.',
    },
    {
        icon: Images,
        title: 'Galeri foto',
        body: 'Pamerkan momen prewedding kalian dalam galeri yang elegan.',
    },
    {
        icon: MapPin,
        title: 'Lokasi & countdown',
        body: 'Peta Google Maps dan hitung mundur otomatis menuju hari bahagia.',
    },
];

function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
        >
            <span className="sr-only">Ganti tema</span>
            {isDark ? (
                <Sun className="size-5" />
            ) : (
                <Moon className="size-5" />
            )}
        </Button>
    );
}

export default function Welcome({ packages }: Props) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 text-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100">
            <Head title="LibraDigital — Undangan Digital Pernikahan" />

            {/* Nav */}
            <header className="sticky top-0 z-20 border-b border-rose-200/50 bg-white/70 backdrop-blur dark:border-rose-900/30 dark:bg-neutral-950/60">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
                        <Heart className="size-5 text-rose-500" />
                        LibraDigital
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {auth.user ? (
                            <Button asChild>
                                <Link href={dashboard.url()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost">
                                    <Link href={login()}>Masuk</Link>
                                </Button>
                                <Button asChild>
                                    <Link href={register()}>Daftar</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="mx-auto w-full max-w-4xl px-6 py-24 text-center">
                <Badge variant="secondary" className="mb-6">
                    Undangan digital untuk pasangan Indonesia
                </Badge>
                <h1 className="font-serif text-4xl font-semibold text-rose-900 sm:text-6xl dark:text-rose-100">
                    Buat undangan pernikahan digital dalam 10 menit
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    Cantik, animated, dan sepenuhnya self-serve. Isi data
                    mempelai, pilih template, bayar, dan undangan langsung aktif
                    di tautan pribadi Anda.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button asChild size="lg">
                        <Link href={auth.user ? dashboard.url() : register()}>
                            <Heart className="size-4" /> Buat Undangan
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <a href="#harga">Lihat Paket</a>
                    </Button>
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto w-full max-w-6xl px-6 py-16">
                <h2 className="text-center font-serif text-3xl font-semibold text-rose-900 dark:text-rose-100">
                    Semua yang Anda butuhkan
                </h2>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-2xl border border-rose-200/60 bg-white/70 p-6 dark:border-rose-900/40 dark:bg-neutral-900/60"
                        >
                            <feature.icon className="size-8 text-rose-500" />
                            <h3 className="mt-4 text-lg font-medium">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {feature.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section id="harga" className="mx-auto w-full max-w-6xl px-6 py-16">
                <h2 className="text-center font-serif text-3xl font-semibold text-rose-900 dark:text-rose-100">
                    Pilih paket Anda
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                    Bayar sekali per undangan. Tidak ada biaya berlangganan
                    tersembunyi.
                </p>
                <div className="mt-12 grid gap-6 lg:grid-cols-4">
                    {packages.map((pkg) => {
                        const popular = pkg.value === 'standard';

                        return (
                            <div
                                key={pkg.value}
                                className={`relative flex flex-col rounded-2xl border p-6 ${
                                    popular
                                        ? 'border-rose-400 bg-white shadow-lg ring-2 ring-rose-300 dark:bg-neutral-900'
                                        : 'border-rose-200/60 bg-white/70 dark:border-rose-900/40 dark:bg-neutral-900/60'
                                }`}
                            >
                                {popular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        Paling Populer
                                    </Badge>
                                )}
                                <h3 className="font-serif text-xl font-semibold">
                                    {pkg.label}
                                </h3>
                                <p className="mt-3 text-3xl font-bold">
                                    {formatRupiah(pkg.price)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {pkg.duration_months
                                        ? `Aktif ${pkg.duration_months} bulan`
                                        : 'Aktif selamanya'}
                                </p>
                                <ul className="mt-6 grid flex-1 gap-3 text-sm">
                                    {pkg.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2"
                                        >
                                            <Check className="mt-0.5 size-4 shrink-0 text-rose-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    asChild
                                    className="mt-8"
                                    variant={popular ? 'default' : 'outline'}
                                >
                                    <Link
                                        href={auth.user ? dashboard.url() : register()}
                                    >
                                        Pilih {pkg.label}
                                    </Link>
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-rose-200/50 py-10 text-center dark:border-rose-900/30">
                <p className="font-serif text-lg">
                    <Heart className="mr-1 inline size-4 text-rose-500" />
                    LibraDigital
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    Dibuat dengan 🤍 untuk pasangan Indonesia
                </p>
            </footer>
        </div>
    );
}
