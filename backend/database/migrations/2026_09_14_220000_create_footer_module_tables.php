<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('footer_columns', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedInteger('display_order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('footer_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('footer_column_id')->constrained('footer_columns')->cascadeOnDelete();
            $table->string('label');
            $table->string('url', 500);
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('opens_new_tab')->default(false);
            $table->timestamps();
            $table->index(['footer_column_id', 'display_order']);
        });

        Schema::create('footer_social_links', function (Blueprint $table) {
            $table->id();
            $table->string('platform', 32); // facebook, instagram, tiktok, x, youtube, whatsapp
            $table->string('url', 500);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        Schema::create('payment_method_logos', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo_path');
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('brands', function (Blueprint $table) {
            if (! Schema::hasColumn('brands', 'show_in_footer')) {
                $table->boolean('show_in_footer')->default(true)->after('is_featured');
            }
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            if (Schema::hasColumn('brands', 'show_in_footer')) {
                $table->dropColumn('show_in_footer');
            }
        });
        Schema::dropIfExists('payment_method_logos');
        Schema::dropIfExists('footer_social_links');
        Schema::dropIfExists('footer_links');
        Schema::dropIfExists('footer_columns');
    }
};
