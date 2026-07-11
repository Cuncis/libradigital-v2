import { Link, usePage } from '@inertiajs/react';
import { Heart, Moon, Sun } from 'lucide-react';
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
                    <Button asChild variant="ghost" className="hidden sm:inline-flex">
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

export function SiteFooter() {
    return (
        <footer className="border-t border-brand/15 py-10 text-center dark:border-white/10">
            <p className="font-heading text-xl font-semibold text-brand dark:text-white">
                <Heart className="mr-1 inline size-4 text-gold" />
                LibraDigital
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
                Dibuat dengan 🤍 untuk pasangan Indonesia
            </p>
        </footer>
    );
}
