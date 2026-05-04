<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('stage')->default('new');
            $table->decimal('value', 12, 2)->default(0);
            $table->date('expected_close_date')->nullable();
            $table->unsignedTinyInteger('probability')->default(10);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'stage']);
            $table->index(['owner_id', 'expected_close_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
