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
            // Basic Information
            $table->string('middle_name')->nullable()->after('last_name');
            $table->string('mobile')->nullable()->after('phone');
            $table->string('industry')->nullable()->after('job_title');
            $table->string('linkedin')->nullable()->after('industry');
            $table->string('position_applied')->nullable();
            $table->string('last_company')->nullable();
            $table->string('gender_identity')->nullable();
            $table->string('lead_source')->nullable();
            $table->string('title')->nullable();

            // Address Information
            $table->text('street')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();

            // Lead-specific
            $table->text('reason_not_qualified')->nullable();
            $table->decimal('estimated_value', 12, 2)->nullable();

            // NFIS/Service-related (Social Media fields)
            $table->string('nfis_funding')->nullable();
            $table->boolean('complex_needs_client')->nullable();
            $table->string('nfis_isi_field')->nullable();
            $table->text('nfis_accommodation')->nullable();
            $table->string('regional_territory')->nullable();
            $table->boolean('in_area')->nullable();
            $table->boolean('in_marylands')->nullable();
            $table->boolean('in_pacific_pines')->nullable();

            // Service Interests
            $table->string('business_unit')->nullable();
            $table->text('service_description')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn([
                'middle_name',
                'mobile',
                'industry',
                'linkedin',
                'position_applied',
                'last_company',
                'gender_identity',
                'lead_source',
                'title',
                'street',
                'city',
                'state',
                'postal_code',
                'country',
                'reason_not_qualified',
                'estimated_value',
                'nfis_funding',
                'complex_needs_client',
                'nfis_isi_field',
                'nfis_accommodation',
                'regional_territory',
                'in_area',
                'in_marylands',
                'in_pacific_pines',
                'business_unit',
                'service_description',
            ]);
        });
    }
};
