<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->index();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('page_path', 255)->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_conversation_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('content');
            $table->timestamps();
            $table->index(['ai_conversation_id', 'id']);
        });

        Schema::create('search_queries', function (Blueprint $table) {
            $table->id();
            $table->string('query', 180);
            $table->string('source', 20)->default('text');
            $table->unsignedInteger('results_count')->default(0);
            $table->json('parsed')->nullable();
            $table->timestamps();
            $table->index('created_at');
            $table->index('results_count');
        });

        Schema::create('ai_logs', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 40);
            $table->string('status', 20);
            $table->unsignedInteger('latency_ms')->nullable();
            $table->string('message', 255)->nullable();
            $table->timestamps();
            $table->index(['kind', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_logs');
        Schema::dropIfExists('search_queries');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
    }
};
