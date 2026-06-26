<?php

namespace App\Models;

use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasFactory;

    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'linkedin_url',
        'job_title',
        'seniority_level',
        'company_name',
        'industry',
        'company_size',
        'annual_revenue',
        'company_website',
        'country',
        'region',
        'source_type',
        'source_campaign',
        'source_url',
        'status',
        'priority',
        'disqualified_reason',
        'icp_score',
        'icp_tier',
        'bant_budget',
        'bant_budget_amount',
        'bant_authority',
        'bant_need',
        'bant_need_score',
        'bant_timeline',
        'interest_area',
        'pain_points',
        'initial_notes',
        'competitor_mention',
        'assigned_to',
        'created_by',
        'converted_at',
        'converted_contact_id',
        'converted_account_id',
        'converted_opportunity_id',
        'api_source_id',
        'import_batch_id',
        'touchpoint_count',
        'first_contacted_at',
        'last_activity_at',
        'follow_up_due_at',
    ];

    protected $appends = ['name'];

    protected function casts(): array
    {
        return [
            'converted_at' => 'datetime',
            'first_contacted_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'follow_up_due_at' => 'datetime',
            'bant_budget_amount' => 'decimal:2',
            'icp_score' => 'integer',
            'touchpoint_count' => 'integer',
        ];
    }

    public function fieldValues(): HasMany
    {
        return $this->hasMany(LeadFieldValue::class);
    }

    public function getCustomFieldsAttribute(): array
    {
        return $this->fieldValues->keyBy('lead_field_id')->map(fn ($v) => $v->value)->all();
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function convertedContact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'converted_contact_id');
    }

    public function convertedAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'converted_account_id');
    }

    public function convertedOpportunity(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'converted_opportunity_id');
    }

    public function isConverted(): bool
    {
        return $this->status === 'converted';
    }

    public function isDisqualified(): bool
    {
        return $this->status === 'disqualified';
    }
}
