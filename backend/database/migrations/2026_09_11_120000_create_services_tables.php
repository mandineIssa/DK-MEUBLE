<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('services')) {
            Schema::create('services', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('icon')->nullable();
                $table->string('icon_image')->nullable();
                $table->text('short_description')->nullable();
                $table->longText('full_content')->nullable();
                $table->unsignedInteger('display_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->boolean('is_featured')->default(false);
                $table->string('cta_label')->nullable();
                $table->string('cta_link')->nullable();
                $table->string('meta_title')->nullable();
                $table->string('meta_description')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('services', function (Blueprint $table) {
                if (! Schema::hasColumn('services', 'icon')) {
                    $table->string('icon')->nullable();
                }
                if (! Schema::hasColumn('services', 'icon_image')) {
                    $table->string('icon_image')->nullable();
                }
                if (! Schema::hasColumn('services', 'short_description')) {
                    $table->text('short_description')->nullable();
                }
                if (! Schema::hasColumn('services', 'full_content')) {
                    $table->longText('full_content')->nullable();
                }
                if (! Schema::hasColumn('services', 'display_order')) {
                    $table->unsignedInteger('display_order')->default(0);
                }
                if (! Schema::hasColumn('services', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (! Schema::hasColumn('services', 'is_featured')) {
                    $table->boolean('is_featured')->default(false);
                }
                if (! Schema::hasColumn('services', 'cta_label')) {
                    $table->string('cta_label')->nullable();
                }
                if (! Schema::hasColumn('services', 'cta_link')) {
                    $table->string('cta_link')->nullable();
                }
                if (! Schema::hasColumn('services', 'meta_title')) {
                    $table->string('meta_title')->nullable();
                }
                if (! Schema::hasColumn('services', 'meta_description')) {
                    $table->string('meta_description')->nullable();
                }
            });
        }

        if (! Schema::hasTable('service_requests')) {
            Schema::create('service_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
                $table->string('customer_name');
                $table->string('phone');
                $table->string('email')->nullable();
                $table->string('product_reference')->nullable();
                $table->text('message');
                $table->string('status')->default('nouveau');
                $table->string('assigned_to')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
        Schema::dropIfExists('services');
    }
};
