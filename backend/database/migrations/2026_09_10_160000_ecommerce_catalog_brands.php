<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_path')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('display_order')->default(0);
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('category_id')->constrained()->nullOnDelete();
            $table->string('sku')->nullable()->after('slug');
            $table->string('short_description', 500)->nullable()->after('description');
            $table->unsignedInteger('promo_price')->nullable()->after('price');
            $table->string('condition')->default('neuf')->after('promo_price'); // neuf|reconditionne
            $table->boolean('is_clearance')->default(false)->after('condition');
            $table->unsignedInteger('stock_quantity')->nullable()->after('is_clearance');
            $table->json('specs')->nullable()->after('stock_quantity');
            $table->string('meta_title')->nullable()->after('specs');
            $table->string('meta_description')->nullable()->after('meta_title');
        });

        // SQLite: status was enum draft|published — widen via recreate not needed if we store as string
        // Laravel sqlite stores enum as varchar; validation will accept archived.

        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_attribute_id')->constrained()->cascadeOnDelete();
            $table->string('value');
            $table->timestamps();
            $table->unique(['product_id', 'category_attribute_id'], 'pav_product_attr_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_attribute_values');
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('brand_id');
            $table->dropColumn([
                'sku', 'short_description', 'promo_price', 'condition', 'is_clearance',
                'stock_quantity', 'specs', 'meta_title', 'meta_description',
            ]);
        });
        Schema::dropIfExists('brands');
    }
};
