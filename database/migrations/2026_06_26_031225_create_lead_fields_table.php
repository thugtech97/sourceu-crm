<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('section', 100);
            $table->string('label', 150);
            $table->string('key', 100)->unique();
            $table->enum('type', ['text', 'email', 'phone', 'url', 'number', 'currency', 'date', 'select', 'textarea', 'toggle', 'score']);
            $table->json('options')->nullable();
            $table->string('placeholder', 200)->nullable();
            $table->boolean('required')->default(false);
            $table->boolean('show_on_list')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
            $table->index('section');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_fields');
    }
};
