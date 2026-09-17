<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'category_id'], 'products_status_category_idx');
            $table->index(['status', 'price'], 'products_status_price_idx');
            $table->index(['status', 'is_clearance'], 'products_status_clearance_idx');
            $table->index(['status', 'condition'], 'products_status_condition_idx');
            $table->index('created_at', 'products_created_at_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'order_status')) {
                return;
            }
            $table->index('order_status', 'orders_order_status_idx');
            $table->index('payment_method', 'orders_payment_method_idx');
            $table->index('created_at', 'orders_created_at_idx');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->index('status', 'quotes_status_idx');
            $table->index('created_at', 'quotes_created_at_idx');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->index('status', 'contact_messages_status_idx');
            $table->index('created_at', 'contact_messages_created_at_idx');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index(['parent_id', 'is_active', 'display_order'], 'categories_parent_active_order_idx');
            $table->index(['is_popular', 'popular_order'], 'categories_popular_idx');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_status_category_idx');
            $table->dropIndex('products_status_price_idx');
            $table->dropIndex('products_status_clearance_idx');
            $table->dropIndex('products_status_condition_idx');
            $table->dropIndex('products_created_at_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_order_status_idx');
            $table->dropIndex('orders_payment_method_idx');
            $table->dropIndex('orders_created_at_idx');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropIndex('quotes_status_idx');
            $table->dropIndex('quotes_created_at_idx');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropIndex('contact_messages_status_idx');
            $table->dropIndex('contact_messages_created_at_idx');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_parent_active_order_idx');
            $table->dropIndex('categories_popular_idx');
        });
    }
};
