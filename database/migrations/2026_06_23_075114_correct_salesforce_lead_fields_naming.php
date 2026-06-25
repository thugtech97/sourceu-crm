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
            // Rename NFIS fields to NDIS
            $table->renameColumn('nfis_funding', 'ndis_funding');
            $table->renameColumn('nfis_isi_field', 'sm_field_ndis_funding');
            $table->renameColumn('nfis_accommodation', 'ndis_accommodation');

            // Rename location/status checkboxes with human-readable names
            $table->renameColumn('complex_needs_client', 'client_with_complex_needs');
            $table->renameColumn('in_area', 'are_you_in_the_area');
            $table->renameColumn('in_marylands', 'are_you_in_merrylands');
            $table->renameColumn('in_pacific_pines', 'are_you_in_pacific_pines');
            $table->renameColumn('regional_territory', 'region_territory');

            // Rename address fields
            $table->renameColumn('postal_code', 'zip_postal_code');
            $table->renameColumn('state', 'state_province');

            // Add missing fields
            $table->string('lead_owner')->nullable()->after('owner_id');
            $table->string('salutation')->nullable()->after('first_name');
            $table->string('suffix')->nullable()->after('last_name');
            $table->string('business_type')->nullable()->after('industry');
            $table->string('role')->nullable()->after('job_title');
            $table->string('other_phone')->nullable()->after('mobile');
            $table->string('lead_status')->nullable()->after('status');
            $table->text('services')->nullable()->after('business_unit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            // Reverse NDIS renames to NFIS
            $table->renameColumn('ndis_funding', 'nfis_funding');
            $table->renameColumn('sm_field_ndis_funding', 'nfis_isi_field');
            $table->renameColumn('ndis_accommodation', 'nfis_accommodation');

            // Reverse location/status checkbox renames
            $table->renameColumn('client_with_complex_needs', 'complex_needs_client');
            $table->renameColumn('are_you_in_the_area', 'in_area');
            $table->renameColumn('are_you_in_merrylands', 'in_marylands');
            $table->renameColumn('are_you_in_pacific_pines', 'in_pacific_pines');
            $table->renameColumn('region_territory', 'regional_territory');

            // Reverse address field renames
            $table->renameColumn('zip_postal_code', 'postal_code');
            $table->renameColumn('state_province', 'state');

            // Drop new fields
            $table->dropColumn([
                'lead_owner',
                'salutation',
                'suffix',
                'business_type',
                'role',
                'other_phone',
                'lead_status',
                'services',
            ]);
        });
    }
};
