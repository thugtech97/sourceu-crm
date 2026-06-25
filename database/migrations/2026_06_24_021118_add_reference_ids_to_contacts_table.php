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
            $table->foreignId('industry_id')->nullable()->constrained('industries')->onDelete('set null');
            $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');
            $table->foreignId('business_type_id')->nullable()->constrained('business_types')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['industry_id']);
            $table->dropForeignKeyIfExists(['role_id']);
            $table->dropForeignKeyIfExists(['business_type_id']);
            $table->dropColumn(['industry_id', 'role_id', 'business_type_id']);
        });
    }
};
