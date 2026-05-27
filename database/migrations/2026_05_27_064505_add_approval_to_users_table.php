<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_approved')->default(false)->after('email_verified_at');
            $table->boolean('is_admin')->default(false)->after('is_approved');
        });

        // Approve and grant admin to all existing users so they retain access.
        DB::table('users')->update(['is_approved' => true, 'is_admin' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_approved', 'is_admin']);
        });
    }
};
