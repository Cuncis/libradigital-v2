import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { Badge } from '@/components/ui/badge';
import { formatIndoDate } from '@/lib/format';
import blog from '@/routes/blog';

interface Post {
    id: number;
    title: string;
    slug: string;
    category_label: string;
    cover_url: string | null;
    excerpt: string | null;
    body: string;
    author_name: string;
    published_at: string | null;
    url: string;
}

interface RelatedPost {
    id: number;
    title: string;
    cover_url: string | null;
    category_label: string;
    url: string;
}

interface Props {
    post: Post;
    related: RelatedPost[];
}

export default function BlogShow({ post, related }: Props) {
    const paragraphs = post.body
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef3f6] via-white to-[#eef3f6] font-body text-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100">
            <Head title={`${post.title} — Blog LibraDigital`}>
                {post.excerpt && (
                    <meta name="description" content={post.excerpt} />
                )}
            </Head>

            <SiteHeader />

            <article className="mx-auto w-full max-w-3xl px-6 py-12">
                <Link
                    href={blog.index().url}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand dark:hover:text-gold"
                >
                    <ArrowLeft className="size-4" /> Kembali ke blog
                </Link>

                <div className="mt-6">
                    <Badge variant="secondary">{post.category_label}</Badge>
                    <h1 className="mt-4 font-heading text-4xl font-semibold text-brand sm:text-5xl dark:text-white">
                        {post.title}
                    </h1>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="size-4" />
                        {post.published_at
                            ? formatIndoDate(post.published_at)
                            : '—'}
                        <span>·</span>
                        <span>{post.author_name}</span>
                    </div>
                </div>

                {post.cover_url && (
                    <img
                        src={post.cover_url}
                        alt={post.title}
                        className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
                    />
                )}

                <div className="mt-8 space-y-5 text-base leading-relaxed text-neutral-700 dark:text-neutral-200">
                    {paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </article>

            {related.length > 0 && (
                <section className="mx-auto w-full max-w-3xl px-6 pb-16">
                    <h2 className="font-heading text-2xl font-semibold text-brand dark:text-white">
                        Artikel terkait
                    </h2>
                    <div className="mt-6 grid gap-6 sm:grid-cols-3">
                        {related.map((item) => (
                            <Link
                                key={item.id}
                                href={item.url}
                                className="group overflow-hidden rounded-xl border border-brand/15 bg-white/70 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-neutral-900/60"
                            >
                                <div className="aspect-[16/9] overflow-hidden bg-brand/5 dark:bg-neutral-800">
                                    {item.cover_url && (
                                        <img
                                            src={item.cover_url}
                                            alt={item.title}
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    )}
                                </div>
                                <div className="p-4">
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {item.category_label}
                                    </Badge>
                                    <p className="mt-2 line-clamp-2 text-sm font-medium text-brand group-hover:text-brand/80 dark:text-white dark:group-hover:text-gold">
                                        {item.title}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <SiteFooter />
        </div>
    );
}
