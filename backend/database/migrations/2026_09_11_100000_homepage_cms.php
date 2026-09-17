<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homepage_sections', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // hero, trust_badges, category_grid, product_carousel, brands, newsletter, socials
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('banner_image')->nullable();
            $table->string('banner_link')->nullable();
            $table->string('selection_mode')->nullable(); // manual, recent, bestseller, on_sale
            $table->unsignedTinyInteger('products_limit')->default(8);
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('homepage_slides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->nullable()->constrained('homepage_sections')->cascadeOnDelete();
            $table->string('image_desktop');
            $table->string('image_mobile')->nullable();
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('link_url')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('homepage_section_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('homepage_sections')->cascadeOnDelete();
            $table->string('item_type')->default('generic'); // trust, category_tile
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('icon')->nullable();
            $table->string('image_url')->nullable();
            $table->string('link_url')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('homepage_featured_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('homepage_sections')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            $table->unique(['section_id', 'product_id']);
        });

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('source')->default('homepage');
            $table->timestamp('subscribed_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('homepage_featured_products');
        Schema::dropIfExists('homepage_section_items');
        Schema::dropIfExists('homepage_slides');
        Schema::dropIfExists('homepage_sections');
    }
};
