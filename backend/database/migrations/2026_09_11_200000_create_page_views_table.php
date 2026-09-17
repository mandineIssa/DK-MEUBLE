<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 500);
            $table->string('title', 255)->nullable();
            $table->string('referrer', 1000)->nullable();
            $table->string('source', 80)->nullable()->index();
            $table->string('utm_source', 120)->nullable();
            $table->string('utm_medium', 120)->nullable();
            $table->string('utm_campaign', 160)->nullable();
            $table->string('session_id', 64)->index();
            $table->string('visitor_id', 64)->index();
            $table->string('device', 20)->default('desktop')->index();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index(['path', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
