<?php

use App\Enums\BlogCategory;
use App\Enums\BlogStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('the public blog index lists published posts and hides drafts', function () {
    $published = BlogPost::factory()->published()->create();
    $draft = BlogPost::factory()->draft()->create();

    $this->get(route('blog.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/index')
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', $published->slug),
        );

    expect($draft->isPublished())->toBeFalse();
});

test('the public blog index can filter by category', function () {
    BlogPost::factory()->published()->create(['category' => BlogCategory::Tips]);
    BlogPost::factory()->published()->create(['category' => BlogCategory::News]);

    $this->get(route('blog.index', ['category' => BlogCategory::Tips->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('posts.data', 1));
});

test('a published post is viewable on its public page', function () {
    $post = BlogPost::factory()->published()->create();

    $this->get(route('blog.show', $post->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/show')
            ->where('post.slug', $post->slug)
            ->has('post.body'),
        );
});

test('a draft post returns 404 on its public page', function () {
    $post = BlogPost::factory()->draft()->create();

    $this->get(route('blog.show', $post->slug))->assertNotFound();
});

test('guests cannot reach the admin blog area', function () {
    $this->get(route('admin.blog.index'))->assertRedirect();
});

test('non-admin users are forbidden from the admin blog area', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->get(route('admin.blog.index'))->assertForbidden();
});

test('a superadmin can list posts in the admin area', function () {
    $admin = User::factory()->admin()->create();
    BlogPost::factory()->count(2)->create();

    $this->actingAs($admin)->get(route('admin.blog.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/blog/index')
            ->has('posts.data', 2),
        );
});

test('a superadmin can create a published post with a generated slug', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.blog.store'), [
        'title' => 'Tips Undangan Digital Terbaik',
        'category' => BlogCategory::Tips->value,
        'status' => BlogStatus::Published->value,
        'excerpt' => 'Ringkasan singkat.',
        'body' => 'Isi artikel yang panjang dan bermanfaat.',
    ])->assertRedirect(route('admin.blog.index'));

    $post = BlogPost::firstWhere('title', 'Tips Undangan Digital Terbaik');

    expect($post)->not->toBeNull()
        ->and($post->slug)->toBe('tips-undangan-digital-terbaik')
        ->and($post->author_id)->toBe($admin->id)
        ->and($post->status)->toBe(BlogStatus::Published)
        ->and($post->published_at)->not->toBeNull();
});

test('a draft post is stored without a publish date', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.blog.store'), [
        'title' => 'Draf Artikel',
        'category' => BlogCategory::Guide->value,
        'status' => BlogStatus::Draft->value,
        'body' => 'Konten draf.',
    ])->assertRedirect();

    expect(BlogPost::firstWhere('title', 'Draf Artikel')->published_at)->toBeNull();
});

test('creating a post requires a title and body', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.blog.store'), [
        'category' => BlogCategory::Tips->value,
        'status' => BlogStatus::Published->value,
    ])->assertSessionHasErrors(['title', 'body']);
});

test('a superadmin can store a cover image on the media disk', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.blog.store'), [
        'title' => 'Artikel Bergambar',
        'category' => BlogCategory::Inspiration->value,
        'status' => BlogStatus::Published->value,
        'body' => 'Konten.',
        'cover' => UploadedFile::fake()->image('cover.jpg'),
    ])->assertRedirect();

    $post = BlogPost::firstWhere('title', 'Artikel Bergambar');

    expect($post->cover_path)->not->toBeNull();
    Storage::disk('public')->assertExists($post->cover_path);
});

test('a superadmin can update a post', function () {
    $admin = User::factory()->admin()->create();
    $post = BlogPost::factory()->published()->create(['title' => 'Judul Lama']);

    $this->actingAs($admin)->post(route('admin.blog.update', $post->slug), [
        'title' => 'Judul Baru',
        'category' => $post->category->value,
        'status' => BlogStatus::Published->value,
        'body' => $post->body,
    ])->assertRedirect(route('admin.blog.index'));

    expect($post->fresh()->title)->toBe('Judul Baru');
});

test('a superadmin can delete a post', function () {
    $admin = User::factory()->admin()->create();
    $post = BlogPost::factory()->create();

    $this->actingAs($admin)->delete(route('admin.blog.destroy', $post->slug))
        ->assertRedirect();

    expect(BlogPost::find($post->id))->toBeNull();
});
