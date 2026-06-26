<?php

namespace App\Models;

use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class Contact extends Model implements Auditable
{
    /** @use HasFactory<ContactFactory> */
    use AuditableTrait;

    use HasFactory;

    public const SOURCE_INBOUND = 'inbound';

    public const SOURCE_COLD = 'cold';

    public const DISPOSITION_OPPORTUNITY = 'opportunity';

    protected $fillable = [
        'owner_id',
        'lead_owner',
        'account_id',
        'industry_id',
        'role_id',
        'business_type_id',
        'lead_source_id',
        'contact_import_batch_id',
        'first_name',
        'salutation',
        'middle_name',
        'last_name',
        'suffix',
        'email',
        'phone',
        'mobile',
        'other_phone',
        'dialpad_contact_id',
        'job_title',
        'role',
        'title',
        'company_name',
        'industry',
        'business_type',
        'linkedin',
        'position_applied',
        'last_company',
        'gender_identity',
        'lead_source',
        'employee_size',
        'status',
        'lead_status',
        'notes',
        'source_type',
        'disposition',
        'converted_by',
        'archived_at',
        'archive_reason',
        'archived_by',
        // Address
        'street',
        'city',
        'state_province',
        'zip_postal_code',
        'country',
        // Lead-specific
        'reason_not_qualified',
        'estimated_value',
        // NDIS/Service-related
        'ndis_funding',
        'client_with_complex_needs',
        'sm_field_ndis_funding',
        'ndis_accommodation',
        'region_territory',
        'are_you_in_the_area',
        'are_you_in_merrylands',
        'are_you_in_pacific_pines',
        // Service Interests
        'business_unit',
        'services',
        'service_description',
    ];

    protected $appends = [
        'name',
    ];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
            'client_with_complex_needs' => 'boolean',
            'are_you_in_the_area' => 'boolean',
            'are_you_in_merrylands' => 'boolean',
            'are_you_in_pacific_pines' => 'boolean',
            'estimated_value' => 'decimal:2',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function businessType(): BelongsTo
    {
        return $this->belongsTo(BusinessType::class);
    }

    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class);
    }

    public function serviceInterests(): HasMany
    {
        return $this->hasMany(ServiceInterestContact::class);
    }

    public function convertedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_by');
    }

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
