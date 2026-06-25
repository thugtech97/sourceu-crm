<?php

namespace App\Models;

use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Builder;
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

    public const TEAM_SALES = 'sales';

    public const TEAM_COLD_CALLING = 'cold_calling';

    public const DISPOSITION_NEW_LEAD = 'new_lead';

    public const DISPOSITION_OPPORTUNITY = 'opportunity';

    public const DISPOSITION_WARM_EMAIL = 'warm_email';

    public const DISPOSITION_RECYCLED = 'recycled';

    public const DISPOSITION_DNC = 'dnc';

    public const DISPOSITION_HANDOFF_TO_SALES = 'handoff_to_sales';

    public const DISPOSITION_MEETING_BOOKED = 'meeting_booked';

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
        'pool_team',
        'pool_assigned_to',
        'pool_assigned_at',
        'pool_expires_at',
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
            'pool_assigned_at' => 'datetime',
            'pool_expires_at' => 'datetime',
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

    public function poolAssignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pool_assigned_to');
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

    public function isInPool(): bool
    {
        return $this->pool_assigned_to === null
            && in_array($this->disposition, [self::DISPOSITION_NEW_LEAD, self::DISPOSITION_RECYCLED]);
    }

    /** @param Builder<Contact> $query */
    public function scopeInboundPool(Builder $query): void
    {
        $query->where('pool_team', self::TEAM_SALES)
            ->whereNull('pool_assigned_to')
            ->whereIn('disposition', [self::DISPOSITION_NEW_LEAD, self::DISPOSITION_RECYCLED]);
    }

    /** @param Builder<Contact> $query */
    public function scopeColdPool(Builder $query): void
    {
        $query->where('pool_team', self::TEAM_COLD_CALLING)
            ->whereNull('pool_assigned_to')
            ->whereIn('disposition', [self::DISPOSITION_NEW_LEAD, self::DISPOSITION_RECYCLED]);
    }

    /** @param Builder<Contact> $query */
    public function scopeMyLeads(Builder $query, int $userId): void
    {
        $query->where('pool_assigned_to', $userId)
            ->whereIn('disposition', [self::DISPOSITION_NEW_LEAD, self::DISPOSITION_RECYCLED]);
    }
}
