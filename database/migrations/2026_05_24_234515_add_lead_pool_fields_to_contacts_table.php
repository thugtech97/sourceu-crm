<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('source_type')->default('inbound')->after('status'); // inbound, cold
            $table->string('pool_team')->nullable()->after('source_type');      // sales, cold_calling
            $table->foreignId('pool_assigned_to')->nullable()->after('pool_team')->constrained('users')->nullOnDelete();
            $table->timestamp('pool_assigned_at')->nullable()->after('pool_assigned_to');
            $table->timestamp('pool_expires_at')->nullable()->after('pool_assigned_at');
            $table->string('disposition')->default('new_lead')->after('pool_expires_at');
            $table->foreignId('converted_by')->nullable()->after('disposition')->constrained('users')->nullOnDelete();

            $table->index(['pool_team', 'disposition', 'pool_assigned_to']);
            $table->index(['pool_expires_at', 'disposition']);
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropForeign(['pool_assigned_to']);
            $table->dropForeign(['converted_by']);
            $table->dropIndex(['contacts_pool_team_disposition_pool_assigned_to_index']);
            $table->dropIndex(['contacts_pool_expires_at_disposition_index']);
            $table->dropColumn(['source_type', 'pool_team', 'pool_assigned_to', 'pool_assigned_at', 'pool_expires_at', 'disposition', 'converted_by']);
        });
    }
};
