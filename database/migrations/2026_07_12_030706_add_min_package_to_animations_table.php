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
        Schema::table('animations', function (Blueprint $table) {
            // Minimum package tier required to use this animation. Null = available
            // to every package (Starter and up).
            $table->string('min_package')->nullable()->after('effect');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('animations', function (Blueprint $table) {
            $table->dropColumn('min_package');
        });
    }
};
