<?php

namespace App\Models;

use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
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
        'account_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'dialpad_contact_id',
        'job_title',
        'status',
        'notes',
        'source_type',
        'pool_team',
        'pool_assigned_to',
        'pool_assigned_at',
        'pool_expires_at',
        'disposition',
        'converted_by',
    ];

    protected $appends = [
        'name',
    ];

    protected function casts(): array
    {
        return [
            'pool_assigned_at' => 'datetime',
            'pool_expires_at' => 'datetime',
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

    public function poolAssignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pool_assigned_to');
    }

    public function convertedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_by');
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
