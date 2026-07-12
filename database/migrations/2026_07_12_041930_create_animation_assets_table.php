<?php

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
        Schema::create('animation_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pack_id')->constrained('animation_packs')->cascadeOnDelete();
            $table->string('asset_path', 500)->nullable();
            $table->string('asset_url', 500);
            $table->string('motion_type')->default('float-y');
            $table->decimal('position_x', 5, 2)->default(50);
            $table->decimal('position_y', 5, 2)->default(50);
            $table->decimal('width_percent', 5, 2)->default(10);
            $table->decimal('opacity', 3, 2)->default(1);
            $table->unsignedInteger('duration_ms')->default(3000);
            $table->unsignedInteger('delay_ms')->default(0);
            $table->integer('repeat_count')->default(-1);
            $table->integer('z_index')->default(10);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animation_assets');
    }
};
