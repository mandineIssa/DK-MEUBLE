<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('content_reports', 'reporter_name')) {
                $table->string('reporter_name')->nullable()->after('customer_id');
            }
            if (! Schema::hasColumn('content_reports', 'reporter_email')) {
                $table->string('reporter_email')->nullable()->after('reporter_name');
            }
            if (! Schema::hasColumn('content_reports', 'reporter_phone')) {
                $table->string('reporter_phone', 40)->nullable()->after('reporter_email');
            }
            if (! Schema::hasColumn('content_reports', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('reporter_phone');
            }
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('endpoint', 500)->unique();
            $table->string('public_key')->nullable();
            $table->string('auth_token')->nullable();
            $table->string('content_encoding')->nullable();
            $table->timestamps();
        });

        Schema::create('product_chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('status', 32)->default('open')->index();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['product_id', 'customer_id']);
        });

        Schema::create('product_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_chat_id')->constrained('product_chats')->cascadeOnDelete();
            $table->string('sender_type', 20); // customer | admin
            $table->unsignedBigInteger('sender_id');
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->index(['product_chat_id', 'id']);
        });

        Schema::table('notification_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('notification_templates', 'locale')) {
                $table->string('locale', 8)->default('fr')->after('channel');
            }
        });

        // Recréer unique type+channel+locale si possible
        try {
            Schema::table('notification_templates', function (Blueprint $table) {
                $table->dropUnique(['type', 'channel']);
            });
        } catch (\Throwable) {
            // ignore
        }
        try {
            Schema::table('notification_templates', function (Blueprint $table) {
                $table->unique(['type', 'channel', 'locale']);
            });
        } catch (\Throwable) {
            // ignore
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_chat_messages');
        Schema::dropIfExists('product_chats');
        Schema::dropIfExists('push_subscriptions');

        Schema::table('content_reports', function (Blueprint $table) {
            foreach (['reporter_name', 'reporter_email', 'reporter_phone', 'ip_address'] as $col) {
                if (Schema::hasColumn('content_reports', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
