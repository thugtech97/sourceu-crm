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
        Schema::table('contacts', function (Blueprint $table) {
            $table->foreignId('lead_source_id')
                ->nullable()
                ->constrained('lead_sources')
                ->nullOnDelete();
            $table->string('employee_size')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['lead_source_id']);
            $table->dropColumn(['lead_source_id', 'employee_size']);
        });
    }
};
