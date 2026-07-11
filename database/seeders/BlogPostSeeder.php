<?php

namespace Database\Seeders;

use App\Enums\BlogCategory;
use App\Enums\BlogStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogPostSeeder extends Seeder
{
    /**
     * Seed a handful of published articles authored by the superadmin.
     */
    public function run(): void
    {
        $author = User::where('is_admin', true)->orderBy('id')->first()
            ?? User::factory()->admin()->create();

        $posts = [
            [
                'title' => '7 Tips Memilih Tema Undangan Pernikahan Digital',
                'category' => BlogCategory::Tips,
                'excerpt' => 'Bingung menentukan tema undangan? Ikuti tujuh langkah praktis ini agar undangan digital Anda tampil serasi dengan konsep pernikahan.',
            ],
            [
                'title' => 'Inspirasi Undangan Adat Jawa yang Modern dan Elegan',
                'category' => BlogCategory::Inspiration,
                'excerpt' => 'Perpaduan sentuhan tradisional Jawa dengan desain minimalis kekinian yang bisa jadi referensi undangan Anda.',
            ],
            [
                'title' => 'Panduan Lengkap Mengisi Data Undangan dalam 10 Menit',
                'category' => BlogCategory::Guide,
                'excerpt' => 'Langkah demi langkah membuat undangan digital LibraDigital dari nol hingga siap dibagikan ke tamu.',
            ],
            [
                'title' => 'Fitur Baru: Buku Tamu Digital dan Angpao Online',
                'category' => BlogCategory::News,
                'excerpt' => 'Kini tamu bisa meninggalkan ucapan dan mengirim hadiah langsung dari halaman undangan Anda.',
            ],
        ];

        foreach ($posts as $index => $post) {
            BlogPost::updateOrCreate(
                ['slug' => Str::slug($post['title'])],
                [
                    'author_id' => $author->id,
                    'title' => $post['title'],
                    'category' => $post['category'],
                    'status' => BlogStatus::Published,
                    'cover_url' => 'https://placehold.co/1200x630/E11D48/FFFFFF?text='.urlencode(Str::words($post['title'], 3, '')),
                    'excerpt' => $post['excerpt'],
                    'body' => $this->sampleBody($post['title']),
                    'published_at' => now()->subDays(($index + 1) * 3),
                ],
            );
        }
    }

    private function sampleBody(string $title): string
    {
        return collect([
            "Pernikahan adalah momen sekali seumur hidup, dan undangan menjadi kesan pertama yang diterima tamu Anda. Artikel \"{$title}\" ini membahas hal-hal penting yang perlu Anda perhatikan.",
            'Dengan LibraDigital, seluruh proses dilakukan secara self-serve: pilih template, isi data mempelai, tambahkan galeri foto, lalu bagikan tautan pribadi Anda ke seluruh tamu.',
            'Pastikan Anda memilih paket yang sesuai dengan kebutuhan agar semua fitur seperti galeri, love story, dan angpao digital dapat digunakan secara maksimal.',
            'Selamat mempersiapkan hari bahagia Anda bersama LibraDigital. 🤍',
        ])->implode("\n\n");
    }
}
