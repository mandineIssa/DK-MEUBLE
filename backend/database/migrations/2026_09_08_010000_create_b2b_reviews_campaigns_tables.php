<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ninea')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable()->default('Dakar');
            $table->text('notes')->nullable();
            $table->string('status')->default('active'); // active|inactive
            $table->timestamps();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->boolean('is_b2b')->default(false)->after('phone_verified_at');
            $table->boolean('sms_opt_in')->default(true)->after('is_b2b');
            $table->boolean('email_opt_in')->default(true)->after('sms_opt_in');
        });

        Schema::create('b2b_quotes', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->string('status')->default('draft'); // draft|sent|accepted|rejected|invoiced
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();
        });

        Schema::create('b2b_quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('b2b_quote_id')->constrained('b2b_quotes')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('label');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_price')->default(0);
            $table->string('dimensions')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('b2b_quote_id')->nullable()->constrained('b2b_quotes')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('status')->default('draft'); // draft|sent|paid|cancelled
            $table->date('issued_at')->nullable();
            $table->date('due_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_name');
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->string('title')->nullable();
            $table->text('body');
            $table->string('status')->default('pending'); // pending|approved|rejected
            $table->timestamps();
        });

        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('channel'); // sms|email|both
            $table->string('subject')->nullable();
            $table->text('body');
            $table->string('audience')->default('all'); // all|b2b|opt_in
            $table->string('status')->default('draft'); // draft|sending|sent|failed
            $table->unsignedInteger('sent_sms')->default(0);
            $table->unsignedInteger('sent_email')->default(0);
            $table->unsignedInteger('failed')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('product_reviews');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('b2b_quote_items');
        Schema::dropIfExists('b2b_quotes');

        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
            $table->dropColumn(['is_b2b', 'sms_opt_in', 'email_opt_in']);
        });

        Schema::dropIfExists('companies');
    }
};
