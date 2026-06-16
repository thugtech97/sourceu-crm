<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contact_import_batch_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('contact_import_batches')->cascadeOnDelete();
            $table->unsignedInteger('row_number');
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'skipped'])->default('pending');
            $table->text('error_message')->nullable();
            $table->json('data');
            $table->timestamps();

            $table->index(['batch_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_import_batch_records');
    }
};
