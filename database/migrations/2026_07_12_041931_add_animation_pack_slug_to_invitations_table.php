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
        Schema::table('invitations', function (Blueprint $table) {
            // Slug (not FK id) so renaming a pack keeps the reference stable.
            $table->string('animation_pack_slug', 100)->nullable()->after('music_url');
            $table->foreign('animation_pack_slug')
                ->references('slug')->on('animation_packs')
                ->nullOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            $table->dropForeign(['animation_pack_slug']);
            $table->dropColumn('animation_pack_slug');
        });
    }
};
