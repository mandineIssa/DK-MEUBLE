<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('categories')->nullOnDelete();
            $table->string('icon')->nullable()->after('slug');
            $table->string('image_path')->nullable()->after('icon');
            $table->text('description')->nullable()->after('image_path');
            $table->unsignedInteger('display_order')->default(0)->after('description');
            $table->boolean('is_active')->default(true)->after('display_order');
            $table->boolean('is_popular')->default(false)->after('is_active');
            $table->unsignedInteger('popular_order')->default(0)->after('is_popular');
            $table->string('meta_title')->nullable()->after('popular_order');
            $table->string('meta_description')->nullable()->after('meta_title');
            $table->index(['parent_id', 'display_order']);
            $table->index(['is_active', 'is_popular']);
        });

        Schema::create('category_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('field_type')->default('select'); // select|number|boolean
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_filterable')->default(true);
            $table->timestamps();
            $table->unique(['category_id', 'slug']);
        });

        Schema::create('category_attribute_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_attribute_id')->constrained()->cascadeOnDelete();
            $table->string('value');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        Schema::create('category_slug_redirects', function (Blueprint $table) {
            $table->id();
            $table->string('old_slug')->unique();
            $table->string('new_slug');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_slug_redirects');
        Schema::dropIfExists('category_attribute_options');
        Schema::dropIfExists('category_attributes');

        Schema::table('categories', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
            $table->dropColumn([
                'icon', 'image_path', 'description', 'display_order',
                'is_active', 'is_popular', 'popular_order',
                'meta_title', 'meta_description',
            ]);
        });
    }
};
