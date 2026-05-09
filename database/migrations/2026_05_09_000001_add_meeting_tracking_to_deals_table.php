<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->timestamp('meeting_booked_at')->nullable()->after('stage');
            $table->string('meeting_outcome')->nullable()->after('meeting_booked_at');
            $table->text('meeting_outcome_notes')->nullable()->after('meeting_outcome');
            $table->timestamp('meeting_outcome_at')->nullable()->after('meeting_outcome_notes');

            $table->index(['owner_id', 'meeting_booked_at']);
        });
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex(['owner_id', 'meeting_booked_at']);
            $table->dropColumn([
                'meeting_booked_at',
                'meeting_outcome',
                'meeting_outcome_notes',
                'meeting_outcome_at',
            ]);
        });
    }
};
