import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { Pagination } from '@/components/admin/pagination';
import { SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { Badge } from '@/components/ui/badge';
import { formatIndoDate } from '@/lib/format';
import blog from '@/routes/blog';
import type { Paginated } from '@/types';

interface PostCard {
    id: number;
    title: string;
    slug: string;
    category: string;
    category_label: string;
    cover_url: string | null;
    excerpt: string | null;
    author_name: string;
    published_at: string | null;
    url: string;
}

interface Props {
    posts: Paginated<PostCard>;
    categories: { value: string; label: string }[];
    filters: { category: string | null };
}

export default function BlogIndex({ posts, categories, filters }: Props) {
    const filterBy = (category: string | null) => {
        router.get(blog.index().url, category ? { category } : {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef3f6] via-white to-[#eef3f6] font-body text-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100">
            <Head title="Blog - LibraDigital">
                <meta
                    name="description"
                    content="Tips, inspirasi, dan panduan seputar undangan pernikahan digital dari LibraDigital."
                />
            </Head>

            <SiteHeader />

            <section className="mx-auto w-full max-w-6xl px-6 py-16">
                <div className="text-center">
                    <Badge variant="secondary" className="mb-4">
                        Blog LibraDigital
                    </Badge>
                    <h1 className="font-heading text-5xl font-semibold text-brand sm:text-6xl dark:text-white">
                        Inspirasi & panduan pernikahan
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                        Tips, inspirasi tema, dan panduan lengkap membuat
                        undangan digital impian Anda.
                    </p>
                </div>

                {/* Category filter */}
                <div className="mt-10 flex flex-wrap justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => filterBy(null)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                            !filters.category
                                ? 'border-brand bg-brand text-white'
                                : 'border-brand/20 hover:bg-brand/5 dark:border-white/15 dark:hover:bg-white/5'
                        }`}
                    >
                        Semua
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.value}
                            type="button"
                            onClick={() => filterBy(category.value)}
                            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                                filters.category === category.value
                                    ? 'border-brand bg-brand text-white'
                                    : 'border-brand/20 hover:bg-brand/5 dark:border-white/15 dark:hover:bg-white/5'
                            }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* Posts grid */}
                {posts.data.length === 0 ? (
                    <p className="mt-16 text-center text-muted-foreground">
                        Belum ada artikel untuk kategori ini.
                    </p>
                ) : (
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post) => (
                            <Link
                                key={post.id}
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
                                    <h2 className="mt-3 font-heading text-xl leading-snug font-semibold text-brand group-hover:text-brand/80 dark:text-white dark:group-hover:text-gold">
                                        {post.title}
                                    </h2>
                                    {post.excerpt && (
                                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarDays className="size-3.5" />
                                        {post.published_at
                                            ? formatIndoDate(post.published_at)
                                            : '-'}
                                        <span>·</span>
                                        <span>{post.author_name}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-12">
                    <Pagination
                        links={posts.links}
                        from={posts.from}
                        to={posts.to}
                        total={posts.total}
                    />
                </div>
            </section>

            <SiteFooter />
        </div>
    );
}
