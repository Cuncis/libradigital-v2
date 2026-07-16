import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarHeart,
    Check,
    CreditCard,
    Gift,
    Heart,
    Images,
    LayoutTemplate,
    MapPin,
    PencilLine,
    Quote,
    Send,
    Sparkles,
    Star,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Reveal } from '@/components/public/reveal';
import { SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/use-count-up';
import { useReveal } from '@/hooks/use-reveal';
import { formatIndoDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard, register } from '@/routes';
import blog from '@/routes/blog';
import type { Package } from '@/types/invitation';

interface Demo {
    slug: string;
    package: string | null;
    groom_name: string | null;
    bride_name: string | null;
    cover_photo: string | null;
    template_name: string | null;
    url: string;
}

interface Post {
    title: string;
    slug: string;
    category_label: string;
    cover_url: string | null;
    excerpt: string | null;
    published_at: string | null;
    url: string;
}

interface Props {
    packages: Package[];
    demos: Demo[];
    posts: Post[];
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

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
    {
        icon: LayoutTemplate,
        title: 'Pilih template',
        body: 'Tentukan tema yang paling sesuai dengan konsep pernikahan Anda.',
    },
    {
        icon: PencilLine,
        title: 'Isi data mempelai',
        body: 'Lengkapi nama, tanggal, lokasi, galeri, dan love story lewat stepper.',
    },
    {
        icon: CreditCard,
        title: 'Bayar sekali',
        body: 'Selesaikan pembayaran aman via Midtrans, tanpa biaya langganan.',
    },
    {
        icon: Send,
        title: 'Bagikan tautan',
        body: 'Undangan aktif di tautan pribadi dan siap disebar ke seluruh tamu.',
    },
];

const STATS: {
    value: number;
    suffix: string;
    label: string;
    decimals?: number;
}[] = [
    { value: 2500, suffix: '+', label: 'Undangan dibuat' },
    { value: 180, suffix: 'K+', label: 'Tamu RSVP' },
    { value: 25, suffix: '+', label: 'Pilihan template' },
    { value: 4.9, suffix: '/5', label: 'Rating pengguna', decimals: 1 },
];

const TESTIMONIALS: { name: string; role: string; quote: string }[] = [
    {
        name: 'Andi & Melati',
        role: 'Menikah Juni 2025',
        quote: 'Prosesnya benar-benar 10 menit! Tamu kami banyak yang memuji desainnya yang elegan dan mudah dibuka.',
    },
    {
        name: 'Rizky & Maya',
        role: 'Menikah Maret 2025',
        quote: 'Fitur RSVP dan angpao digital sangat membantu. Semua terpusat di satu tautan, tidak ribet.',
    },
    {
        name: 'Bagus & Dewi',
        role: 'Menikah September 2025',
        quote: 'Bisa ganti data kapan saja lewat dashboard. Sangat worth it untuk paket Premium.',
    },
];

// Corner-ribbon colour per package tier (fallback covers any unmapped value).
const PACKAGE_RIBBON: Record<string, string> = {
    starter: 'bg-slate-500 text-white',
    standard: 'bg-brand text-white',
    premium: 'bg-gold text-gold-foreground',
    signature: 'bg-violet-600 text-white',
};

const FAQS: { q: string; a: string }[] = [
    {
        q: 'Berapa lama undangan saya aktif?',
        a: 'Tergantung paket yang dipilih: mulai dari 3 bulan hingga aktif selamanya pada paket Signature.',
    },
    {
        q: 'Apakah saya bisa mengubah data setelah undangan terbit?',
        a: 'Bisa. Anda dapat mengedit data mempelai, galeri, dan detail acara kapan saja lewat dashboard.',
    },
    {
        q: 'Bagaimana tamu melakukan RSVP?',
        a: 'Tamu cukup membuka tautan undangan lalu mengisi form konfirmasi kehadiran dan ucapan langsung di halaman.',
    },
    {
        q: 'Apakah ada biaya langganan bulanan?',
        a: 'Tidak. Anda hanya membayar sekali per undangan sesuai paket yang dipilih.',
    },
];

function Stat({
    value,
    suffix,
    label,
    decimals,
}: {
    value: number;
    suffix: string;
    label: string;
    decimals?: number;
}) {
    const { ref, visible } = useReveal<HTMLDivElement>();
    const display = useCountUp(value, visible, { decimals });

    return (
        <div ref={ref} className="text-center">
            <p className="font-heading text-4xl font-bold text-brand sm:text-5xl dark:text-white">
                {display}
                {suffix}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

export default function Welcome({ packages, demos, posts }: Props) {
    const { auth } = usePage().props;
    const ctaHref = auth.user ? dashboard.url() : register();

    // Trigger the hero entrance stagger shortly after mount.
    const [heroIn, setHeroIn] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => setHeroIn(true), 60);

        return () => window.clearTimeout(timer);
    }, []);

    const heroDemo = demos[0];
    const heroCouple =
        [heroDemo?.groom_name, heroDemo?.bride_name]
            .filter(Boolean)
            .join(' & ') || 'Rara & Bayu';

    const heroBase = cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        heroIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
    );
    const heroDelay = (i: number) => ({
        transitionDelay: heroIn ? `${i * 120}ms` : '0ms',
    });

    // Demo tabs: one per package tier that actually has demos, in catalog order.
    const demoTabs = useMemo(
        () =>
            packages
                .map((pkg) => ({
                    value: pkg.value,
                    label: pkg.label,
                    demos: demos.filter((demo) => demo.package === pkg.value),
                }))
                .filter((tab) => tab.demos.length > 0),
        [packages, demos],
    );

    const [activeTab, setActiveTab] = useState(demoTabs[0]?.value ?? '');
    const activeDemos =
        demoTabs.find((tab) => tab.value === activeTab)?.demos ??
        demoTabs[0]?.demos ??
        [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef3f6] via-white to-[#eef3f6] font-body text-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100">
            <Head title="LibraDigital - Undangan Digital Pernikahan" />

            <SiteHeader />

            {/* Hero */}
            <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
                <div className="text-center lg:text-left">
                    <div className={heroBase} style={heroDelay(0)}>
                        <Badge
                            variant="outline"
                            className="mb-6 border-gold/40 bg-gold/10 text-brand dark:text-gold"
                        >
                            Undangan digital untuk pasangan Indonesia
                        </Badge>
                    </div>
                    <h1
                        className={cn(
                            'font-heading text-5xl font-semibold text-brand sm:text-6xl dark:text-white',
                            heroBase,
                        )}
                        style={heroDelay(1)}
                    >
                        Buat undangan pernikahan digital dalam 10 menit
                    </h1>
                    <p
                        className={cn(
                            'mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0',
                            heroBase,
                        )}
                        style={heroDelay(2)}
                    >
                        Cantik, animated, dan sepenuhnya self-serve. Isi data
                        mempelai, pilih template, bayar, dan undangan langsung
                        aktif di tautan pribadi Anda.
                    </p>
                    <div
                        className={cn(
                            'mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start',
                            heroBase,
                        )}
                        style={heroDelay(3)}
                    >
                        <Button
                            asChild
                            size="lg"
                            className="bg-brand text-brand-foreground hover:bg-brand/90"
                        >
                            <Link href={ctaHref}>
                                <Heart className="size-4" /> Buat Undangan
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-brand/30 text-brand hover:bg-brand/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                        >
                            <a href="#demo">Lihat Demo</a>
                        </Button>
                    </div>
                </div>

                {/* Hero visual: phone showing a sample invitation */}
                <div
                    className={cn(
                        'transition-all duration-700 ease-out motion-reduce:transition-none',
                        heroIn
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-6 opacity-0',
                    )}
                    style={{ transitionDelay: heroIn ? '360ms' : '0ms' }}
                >
                    <div className="relative mx-auto w-60 sm:w-64">
                        <div className="absolute -inset-8 -z-10 rounded-full bg-gold/20 blur-3xl" />
                        <div className="animate-float rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl dark:border-neutral-700">
                            <div className="overflow-hidden rounded-[1.8rem] bg-white">
                                <div className="relative aspect-[9/18]">
                                    {heroDemo?.cover_photo ? (
                                        <img
                                            src={heroDemo.cover_photo}
                                            alt=""
                                            className="absolute inset-0 size-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-b from-brand to-[#12354c]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 text-center text-white">
                                        <p className="font-body text-[10px] tracking-[0.25em] text-white/80 uppercase">
                                            The Wedding Of
                                        </p>
                                        <p className="mt-2 font-heading text-2xl font-semibold">
                                            {heroCouple}
                                        </p>
                                        <p className="mt-1 text-xs text-white/80">
                                            Sabtu, 12 Juli 2025
                                        </p>
                                        <span className="mt-4 inline-block rounded-full bg-gold px-4 py-1.5 text-[11px] font-semibold text-gold-foreground">
                                            Buka Undangan
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="mx-auto w-full max-w-5xl px-6 pb-8">
                <div className="grid grid-cols-2 gap-6 rounded-3xl border border-brand/15 bg-white/70 p-8 sm:grid-cols-4 dark:border-white/10 dark:bg-neutral-900/60">
                    {STATS.map((stat) => (
                        <Stat key={stat.label} {...stat} />
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section
                id="cara"
                className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
            >
                <Reveal>
                    <h2 className="text-center font-heading text-4xl font-semibold text-brand dark:text-white">
                        Cara kerjanya
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                        Empat langkah sederhana dari nol hingga undangan siap
                        dibagikan.
                    </p>
                </Reveal>
                <Reveal className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((step, index) => (
                        <div
                            key={step.title}
                            className="relative rounded-2xl border border-brand/15 bg-white/70 p-6 dark:border-white/10 dark:bg-neutral-900/60"
                        >
                            <span className="absolute -top-3 right-4 font-heading text-5xl font-bold text-gold/40 dark:text-gold/25">
                                {index + 1}
                            </span>
                            <step.icon className="size-8 text-gold" />
                            <h3 className="mt-4 text-lg font-medium">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {step.body}
                            </p>
                        </div>
                    ))}
                </Reveal>
            </section>

            {/* Features */}
            <section className="mx-auto w-full max-w-6xl px-6 py-16">
                <Reveal>
                    <h2 className="text-center font-heading text-4xl font-semibold text-brand dark:text-white">
                        Semua yang Anda butuhkan
                    </h2>
                </Reveal>
                <Reveal className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-2xl border border-brand/15 bg-white/70 p-6 dark:border-white/10 dark:bg-neutral-900/60"
                        >
                            <feature.icon className="size-8 text-gold" />
                            <h3 className="mt-4 text-lg font-medium">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {feature.body}
                            </p>
                        </div>
                    ))}
                </Reveal>
            </section>

            {/* Demo Undangan */}
            {demoTabs.length > 0 && (
                <section
                    id="demo"
                    className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
                >
                    <Reveal>
                        <h2 className="text-center font-heading text-4xl font-semibold text-brand dark:text-white">
                            Lihat demo undangan
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                            Jelajahi contoh undangan sesuai paket. Klik untuk
                            membuka undangan seperti yang akan dilihat tamu
                            Anda.
                        </p>

                        {/* Package tabs */}
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {demoTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`rounded-full border px-5 py-1.5 text-sm font-medium transition-colors ${
                                        activeTab === tab.value
                                            ? 'border-brand bg-brand text-white'
                                            : 'border-brand/20 hover:bg-brand/5 dark:border-white/15 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </Reveal>

                    <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                        {activeDemos.map((demo) => {
                            const couple = [demo.groom_name, demo.bride_name]
                                .filter(Boolean)
                                .join(' & ');
                            const tierLabel =
                                packages.find((p) => p.value === demo.package)
                                    ?.label ?? demo.package;
                            const ribbonColor =
                                (demo.package &&
                                    PACKAGE_RIBBON[demo.package]) ||
                                'bg-brand text-white';

                            return (
                                <a
                                    key={demo.slug}
                                    href={demo.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand/15 bg-white/70 transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-neutral-900/60"
                                >
                                    {tierLabel && (
                                        <span
                                            className={`pointer-events-none absolute top-4 -right-12 z-10 w-40 rotate-45 py-1 text-center text-[11px] font-semibold tracking-wide uppercase shadow-md ${ribbonColor}`}
                                        >
                                            {tierLabel}
                                        </span>
                                    )}
                                    <div className="aspect-[3/4] overflow-hidden bg-brand/5 dark:bg-neutral-800">
                                        {demo.cover_photo && (
                                            <img
                                                src={demo.cover_photo}
                                                alt={couple}
                                                loading="lazy"
                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 p-4 sm:p-5">
                                        <div className="min-w-0">
                                            <p className="truncate font-heading text-lg font-semibold text-brand group-hover:text-brand/80 sm:text-xl dark:text-white dark:group-hover:text-gold">
                                                {couple || 'Undangan Demo'}
                                            </p>
                                            {demo.template_name && (
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {demo.template_name}
                                                </p>
                                            )}
                                        </div>
                                        <ArrowRight className="size-5 shrink-0 text-gold transition-transform group-hover:translate-x-1" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Testimonials */}
            <section className="mx-auto w-full max-w-6xl px-6 py-16">
                <Reveal>
                    <h2 className="text-center font-heading text-4xl font-semibold text-brand dark:text-white">
                        Dipercaya ratusan pasangan
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                        Cerita mereka yang sudah berbagi hari bahagia lewat
                        LibraDigital.
                    </p>
                </Reveal>
                <Reveal className="mt-12 grid gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((testimonial) => (
                        <figure
                            key={testimonial.name}
                            className="flex flex-col rounded-2xl border border-brand/15 bg-white/70 p-6 dark:border-white/10 dark:bg-neutral-900/60"
                        >
                            <Quote className="size-7 text-gold" />
                            <div className="mt-3 flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="size-4 fill-gold text-gold"
                                    />
                                ))}
                            </div>
                            <blockquote className="mt-4 flex-1 text-sm text-muted-foreground">
                                “{testimonial.quote}”
                            </blockquote>
                            <figcaption className="mt-6">
                                <p className="font-heading text-lg font-semibold text-brand dark:text-white">
                                    {testimonial.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {testimonial.role}
                                </p>
                            </figcaption>
                        </figure>
                    ))}
                </Reveal>
            </section>

            {/* Pricing */}
            <section
                id="harga"
                className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
            >
                <Reveal>
                    <h2 className="text-center font-heading text-4xl font-semibold text-brand dark:text-white">
                        Pilih paket Anda
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                        Bayar sekali per undangan. Tidak ada biaya berlangganan
                        tersembunyi.
                    </p>
                </Reveal>
                <Reveal className="mt-12 grid gap-6 lg:grid-cols-4">
                    {packages.map((pkg) => {
                        const popular = pkg.value === 'standard';

                        return (
                            <div
                                key={pkg.value}
                                className={`relative flex flex-col rounded-2xl border p-6 ${
                                    popular
                                        ? 'border-gold bg-white shadow-lg ring-2 ring-gold dark:bg-neutral-900'
                                        : 'border-brand/15 bg-white/70 dark:border-white/10 dark:bg-neutral-900/60'
                                }`}
                            >
                                {popular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground hover:bg-gold/90">
                                        Paling Populer
                                    </Badge>
                                )}
                                <h3 className="font-heading text-2xl font-semibold text-brand dark:text-white">
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
                                            <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    asChild
                                    className={`mt-8 ${
                                        popular
                                            ? 'bg-brand text-brand-foreground hover:bg-brand/90'
                                            : 'border-brand/30 bg-transparent text-brand hover:bg-brand/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5'
                                    }`}
                                    variant={popular ? 'default' : 'outline'}
                                >
                                    <Link href={ctaHref}>
                                        Pilih {pkg.label}
                                    </Link>
                                </Button>
                            </div>
                        );
                    })}
                </Reveal>
            </section>

            {/* Blog */}
            {posts.length > 0 && (
                <section className="mx-auto w-full max-w-6xl px-6 py-16">
                    <Reveal>
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <h2 className="font-heading text-4xl font-semibold text-brand dark:text-white">
                                    Dari blog kami
                                </h2>
                                <p className="mt-3 max-w-xl text-muted-foreground">
                                    Tips, inspirasi, dan panduan seputar
                                    undangan pernikahan digital.
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                className="hidden border-brand/30 text-brand hover:bg-brand/5 sm:inline-flex dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                            >
                                <Link href={blog.index().url}>
                                    Semua artikel{' '}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </Reveal>
                    <Reveal className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={post.url}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-brand/15 bg-white/70 transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-neutral-900/60"
                            >
                                <div className="aspect-[16/9] overflow-hidden bg-brand/5 dark:bg-neutral-800">
                                    {post.cover_url && (
                                        <img
                                            src={post.cover_url}
                                            alt={post.title}
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col p-5">
                                    <Badge
                                        variant="secondary"
                                        className="w-fit"
                                    >
                                        {post.category_label}
                                    </Badge>
                                    <h3 className="mt-3 font-heading text-xl leading-snug font-semibold text-brand group-hover:text-brand/80 dark:text-white dark:group-hover:text-gold">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    {post.published_at && (
                                        <p className="mt-4 text-xs text-muted-foreground">
                                            {formatIndoDate(post.published_at)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </Reveal>
                    <div className="mt-8 text-center sm:hidden">
                        <Button
                            asChild
                            variant="outline"
                            className="border-brand/30 text-brand hover:bg-brand/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                        >
                            <Link href={blog.index().url}>
                                Semua artikel <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </section>
            )}

            {/* FAQ */}
            <section
                id="faq"
                className="mx-auto w-full max-w-3xl scroll-mt-24 px-6 py-16"
            >
                <Reveal>
                    <h2 className="text-center font-heading text-4xl font-semibold text-brand dark:text-white">
                        Pertanyaan umum
                    </h2>
                    <div className="mt-10 divide-y divide-brand/15 dark:divide-white/10">
                        {FAQS.map((faq) => (
                            <details key={faq.q} className="group py-4">
                                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                                    {faq.q}
                                    <ArrowRight className="size-4 shrink-0 text-gold transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </Reveal>
            </section>

            {/* Final CTA */}
            <section className="mx-auto w-full max-w-4xl px-6 pb-24">
                <Reveal>
                    <div className="rounded-3xl bg-gradient-to-br from-brand to-[#12354c] px-8 py-14 text-center text-white shadow-xl">
                        <h2 className="font-heading text-4xl font-semibold sm:text-5xl">
                            Siap membuat undangan impian Anda?
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-white/80">
                            Mulai sekarang, gratis untuk mencoba. Bayar hanya
                            saat undangan siap Anda terbitkan.
                        </p>
                        <Button
                            asChild
                            size="lg"
                            className="mt-8 bg-gold text-gold-foreground hover:bg-gold/90"
                        >
                            <Link href={ctaHref}>
                                <Heart className="size-4" /> Buat Undangan
                                Sekarang
                            </Link>
                        </Button>
                    </div>
                </Reveal>
            </section>

            <SiteFooter />
        </div>
    );
}
