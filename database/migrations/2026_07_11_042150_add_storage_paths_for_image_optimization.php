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
        Schema::table('gallery_photos', function (Blueprint $table) {
            $table->string('path')->nullable()->after('photo_url');
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->string('cover_path')->nullable()->after('cover_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gallery_photos', function (Blueprint $table) {
            $table->dropColumn('path');
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropColumn('cover_path');
        });
    }
};
