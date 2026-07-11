<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class, 'author_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('category', ['tips', 'inspiration', 'guide', 'news'])->default('tips');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->string('cover_path')->nullable();
            $table->string('cover_url')->nullable();
            $table->string('excerpt', 500)->nullable();
            $table->longText('body');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
