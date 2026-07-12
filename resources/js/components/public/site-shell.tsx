import { Link, usePage } from '@inertiajs/react';
import { Facebook, Heart, Instagram, Mail, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login, register } from '@/routes';
import blog from '@/routes/blog';

export function ThemeToggle() {
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
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    );
}

export function SiteHeader() {
    const { auth } = usePage().props;

    return (
        <header className="sticky top-0 z-20 border-b border-brand/15 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-neutral-950/60">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-heading text-2xl font-semibold text-brand dark:text-white"
                >
                    <Heart className="size-5 text-gold" />
                    LibraDigital
                </Link>
                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        variant="ghost"
                        className="hidden sm:inline-flex"
                    >
                        <Link href={blog.index().url}>Blog</Link>
                    </Button>
                    <ThemeToggle />
                    {auth.user ? (
                        <Button
                            asChild
                            className="bg-brand text-brand-foreground hover:bg-brand/90"
                        >
                            <Link href={dashboard.url()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button asChild variant="ghost">
                                <Link href={login()}>Masuk</Link>
                            </Button>
                            <Button
                                asChild
                                className="bg-brand text-brand-foreground hover:bg-brand/90"
                            >
                                <Link href={register()}>Daftar</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

const FOOTER_LINKS: {
    heading: string;
    links: { label: string; href: string }[];
}[] = [
    {
        heading: 'Produk',
        links: [
            { label: 'Paket & Harga', href: '/#harga' },
            { label: 'Demo Undangan', href: '/#demo' },
            { label: 'Cara Kerja', href: '/#cara' },
        ],
    },
    {
        heading: 'Perusahaan',
        links: [
            { label: 'Blog', href: '/blog' },
            { label: 'FAQ', href: '/#faq' },
            { label: 'Kontak', href: 'mailto:halo@libradigital.id' },
        ],
    },
    {
        heading: 'Legal',
        links: [
            { label: 'Kebijakan Privasi', href: '/#' },
            { label: 'Syarat & Ketentuan', href: '/#' },
        ],
    },
];

const SOCIALS: { label: string; href: string; icon: typeof Instagram }[] = [
    { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
    { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
    { label: 'Email', href: 'mailto:halo@libradigital.id', icon: Mail },
];

export function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-brand/15 bg-white/50 dark:border-white/10 dark:bg-neutral-950/40">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-heading text-2xl font-semibold text-brand dark:text-white"
                    >
                        <Heart className="size-5 text-gold" />
                        LibraDigital
                    </Link>
                    <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                        Undangan pernikahan digital yang cantik dan sepenuhnya
                        self-serve untuk pasangan Indonesia.
                    </p>
                    <div className="mt-5 flex gap-2">
                        {SOCIALS.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={social.label}
                                className="flex size-9 items-center justify-center rounded-full border border-brand/15 text-brand transition-colors hover:bg-brand hover:text-white dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                            >
                                <social.icon className="size-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {FOOTER_LINKS.map((column) => (
                    <div key={column.heading}>
                        <h3 className="text-sm font-semibold text-brand dark:text-white">
                            {column.heading}
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {column.links.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-muted-foreground transition-colors hover:text-brand dark:hover:text-gold"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t border-brand/15 py-6 text-center dark:border-white/10">
                <p className="text-xs text-muted-foreground">
                    © {year} LibraDigital · Dibuat dengan 🤍 untuk pasangan
                    Indonesia
                </p>
            </div>
        </footer>
    );
}
