<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            if (! Schema::hasColumn('wishlists', 'price_at_save')) {
                $table->unsignedInteger('price_at_save')->nullable()->after('product_id');
            }
            if (! Schema::hasColumn('wishlists', 'last_notified_at')) {
                $table->timestamp('last_notified_at')->nullable()->after('price_at_save');
            }
            if (! Schema::hasColumn('wishlists', 'last_stock_notified_at')) {
                $table->timestamp('last_stock_notified_at')->nullable()->after('last_notified_at');
            }
        });

        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('type', 64)->index();
            $table->string('channel', 32); // email, sms, whatsapp, in_app
            $table->string('subject')->nullable();
            $table->text('body_template');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['type', 'channel']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('type', 64)->index();
            $table->string('title');
            $table->text('message');
            $table->string('link')->nullable();
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false)->index();
            $table->json('channel_sent')->nullable();
            $table->string('digest_key', 120)->nullable()->index();
            $table->timestamps();
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('type', 64);
            $table->boolean('email_enabled')->default(true);
            $table->boolean('sms_enabled')->default(false);
            $table->boolean('whatsapp_enabled')->default(true);
            $table->boolean('in_app_enabled')->default(true);
            $table->timestamps();
            $table->unique(['customer_id', 'type']);
        });

        Schema::create('notification_delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->nullable()->constrained('notifications')->nullOnDelete();
            $table->string('type', 64)->index();
            $table->string('channel', 32)->index();
            $table->string('recipient', 190)->nullable();
            $table->string('status', 32)->default('pending')->index(); // pending, sent, failed
            $table->text('error')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->json('payload')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('content_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reportable_type');
            $table->unsignedBigInteger('reportable_id');
            $table->string('reason', 120);
            $table->text('details')->nullable();
            $table->string('status', 32)->default('new')->index(); // new, in_progress, resolved
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['reportable_type', 'reportable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_reports');
        Schema::dropIfExists('notification_delivery_logs');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('notification_templates');

        Schema::table('wishlists', function (Blueprint $table) {
            foreach (['price_at_save', 'last_notified_at', 'last_stock_notified_at'] as $col) {
                if (Schema::hasColumn('wishlists', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
