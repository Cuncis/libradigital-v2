<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitation_visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('session_id')->nullable();
            $table->timestamp('visited_at')->nullable();

            $table->index(['invitation_id', 'ip_address']);
            $table->index(['invitation_id', 'session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitation_visitors');
    }
};
