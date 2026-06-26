<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Personal info
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 255)->unique();
            $table->string('phone', 50)->nullable();
            $table->string('linkedin_url', 500)->nullable();
            $table->string('job_title', 150)->nullable();
            $table->enum('seniority_level', ['c_suite', 'vp', 'director', 'manager', 'individual'])->nullable();

            // Company info
            $table->string('company_name', 200)->nullable();
            $table->string('industry', 100)->nullable();
            $table->enum('company_size', ['1_10', '11_50', '51_200', '201_500', '500_1000', '1000_plus'])->nullable();
            $table->enum('annual_revenue', ['under_1m', '1m_5m', '5m_10m', '10m_50m', '50m_100m', '100m_500m', '500m_plus'])->nullable();
            $table->string('company_website', 500)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('region', 100)->nullable();

            // Source tracking
            $table->enum('source_type', ['website', 'referral', 'cold_outreach', 'linkedin', 'ad', 'event', 'partner', 'api', 'import', 'other']);
            $table->string('source_campaign', 200)->nullable();
            $table->string('source_url', 500)->nullable();

            // Status & priority
            $table->enum('status', ['new', 'contacted', 'working', 'nurturing', 'qualified', 'disqualified', 'converted'])->default('new');
            $table->enum('priority', ['hot', 'warm', 'cold'])->default('cold');
            $table->enum('disqualified_reason', ['not_a_fit', 'no_budget', 'no_authority', 'bad_timing', 'competitor_chosen', 'unresponsive', 'other'])->nullable();

            // ICP scoring (auto-calculated in Sprint 3)
            $table->tinyInteger('icp_score')->unsigned()->nullable();
            $table->enum('icp_tier', ['a', 'b', 'c', 'd'])->nullable();

            // BANT qualification
            $table->enum('bant_budget', ['confirmed', 'likely', 'unknown', 'none'])->nullable();
            $table->decimal('bant_budget_amount', 12, 2)->nullable();
            $table->enum('bant_authority', ['decision_maker', 'influencer', 'champion', 'unknown'])->nullable();
            $table->text('bant_need')->nullable();
            $table->enum('bant_need_score', ['strong', 'moderate', 'low', 'none'])->nullable();
            $table->enum('bant_timeline', ['immediate', 'short', 'medium', 'long', 'unknown'])->nullable();

            // Qualification notes
            $table->string('interest_area', 500)->nullable();
            $table->text('pain_points')->nullable();
            $table->text('initial_notes')->nullable();
            $table->string('competitor_mention', 200)->nullable();

            // Ownership & assignment (users uses bigint PK)
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // Conversion references (contacts/accounts/deals use bigint PKs)
            $table->timestamp('converted_at')->nullable();
            $table->unsignedBigInteger('converted_contact_id')->nullable();
            $table->unsignedBigInteger('converted_account_id')->nullable();
            $table->unsignedBigInteger('converted_opportunity_id')->nullable();

            // Import / API tracking (lead_imports table added in Sprint 6)
            $table->string('api_source_id', 100)->nullable();
            $table->uuid('import_batch_id')->nullable();

            // Engagement tracking
            $table->unsignedInteger('touchpoint_count')->default(0);
            $table->timestamp('first_contacted_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('follow_up_due_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'priority']);
            $table->index(['assigned_to', 'status']);
            $table->index('icp_tier');
            $table->index('last_activity_at');
            $table->index('follow_up_due_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
