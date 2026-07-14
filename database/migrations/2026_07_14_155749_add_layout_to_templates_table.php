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
        Schema::table('templates', function (Blueprint $table) {
            // The visual builder's node tree (null = not yet migrated / legacy render).
            $table->json('layout')->nullable()->after('thumbnail');
            // Schema version of the tree, so the renderer can migrate old trees forward.
            $table->unsignedTinyInteger('builder_version')->default(1)->after('layout');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['layout', 'builder_version']);
        });
    }
};
