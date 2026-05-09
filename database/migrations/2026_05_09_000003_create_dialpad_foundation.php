<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('dialpad_user_id')->nullable()->unique()->after('email');
            $table->string('dialpad_number')->nullable()->after('dialpad_user_id');
            $table->boolean('dialpad_connected')->default(false)->after('dialpad_number');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->string('dialpad_contact_id')->nullable()->after('phone');
        });

        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('dialpad_call_id')->unique();
            $table->string('dialpad_user_id')->nullable()->index();
            $table->string('direction')->default('outbound');
            $table->string('status')->default('initiated');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->string('recording_url')->nullable();
            $table->string('transcript_url')->nullable();
            $table->text('transcript_text')->nullable();
            $table->boolean('disposition_set')->default(false);
            $table->json('dialpad_payload')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['contact_id', 'started_at']);
            $table->index(['user_id', 'started_at']);
        });

        Schema::create('dialpad_webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('dialpad_call_id')->nullable()->index();
            $table->string('event_type')->index();
            $table->json('payload');
            $table->boolean('processed')->default(false);
            $table->text('error')->nullable();
            $table->timestamps();

            $table->unique(['dialpad_call_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dialpad_webhook_logs');
        Schema::dropIfExists('call_logs');

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn('dialpad_contact_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['dialpad_user_id', 'dialpad_number', 'dialpad_connected']);
        });
    }
};
