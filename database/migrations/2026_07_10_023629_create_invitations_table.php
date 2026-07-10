<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 100)->unique();
            $table->enum('status', ['draft', 'pending_payment', 'active', 'expired'])->default('draft');
            $table->enum('package', ['starter', 'standard', 'premium', 'signature'])->nullable();
            $table->date('active_until')->nullable();
            $table->foreignId('template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('groom_name')->nullable();
            $table->string('bride_name')->nullable();
            $table->dateTime('wedding_date')->nullable();
            $table->enum('timezone', ['WIB', 'WITA', 'WIT'])->default('WIB');
            $table->string('akad_venue')->nullable();
            $table->string('akad_address')->nullable();
            $table->dateTime('akad_datetime')->nullable();
            $table->string('resepsi_venue')->nullable();
            $table->string('resepsi_address')->nullable();
            $table->dateTime('resepsi_datetime')->nullable();
            $table->string('maps_url_akad')->nullable();
            $table->string('maps_url_resepsi')->nullable();
            $table->string('cover_photo')->nullable();
            $table->text('love_story')->nullable();
            $table->string('music_url')->nullable();
            $table->unsignedInteger('visitor_count')->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
