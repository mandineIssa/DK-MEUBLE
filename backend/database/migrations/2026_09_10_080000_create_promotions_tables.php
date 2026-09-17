<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('price_original');
            $table->unsignedBigInteger('price_promo');
            $table->decimal('discount_percent', 8, 2)->default(0);
            $table->string('discount_type')->default('percent'); // percent|fixed
            $table->timestamp('start_date');
            $table->timestamp('end_date');
            $table->string('status')->default('draft'); // draft|active|expired|out_of_stock|rejected
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('featured_order')->default(0);
            $table->string('vendor_name')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'start_date', 'end_date']);
            $table->index(['is_featured', 'featured_order']);
        });

        Schema::create('promotion_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // created|updated|status|price
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_audits');
        Schema::dropIfExists('promotions');
    }
};
