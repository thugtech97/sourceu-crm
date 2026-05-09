<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deal extends Model
{
    /** @use HasFactory<\Database\Factories\DealFactory> */
    use HasFactory;

    public const STAGE_NEW = 'new';
    public const STAGE_MEETING_BOOKED = 'meeting_booked';
    public const STAGE_QUALIFIED = 'qualified';
    public const STAGE_PROPOSAL = 'proposal';
    public const STAGE_WON = 'won';
    public const STAGE_WARM_EMAIL_NURTURE = 'warm_email_nurture';
    public const STAGE_DNC = 'dnc';
    public const STAGE_LOST = 'lost';

    public const MEETING_OUTCOME_QUALIFIED = 'qualified';
    public const MEETING_OUTCOME_WARM_EMAIL_NURTURE = 'warm_email_nurture';
    public const MEETING_OUTCOME_DNC = 'dnc';

    public const STAGES = [
        self::STAGE_NEW,
        self::STAGE_MEETING_BOOKED,
        self::STAGE_QUALIFIED,
        self::STAGE_PROPOSAL,
        self::STAGE_WON,
        self::STAGE_WARM_EMAIL_NURTURE,
        self::STAGE_DNC,
        self::STAGE_LOST,
    ];

    public const MEETING_OUTCOMES = [
        self::MEETING_OUTCOME_QUALIFIED,
        self::MEETING_OUTCOME_WARM_EMAIL_NURTURE,
        self::MEETING_OUTCOME_DNC,
    ];

    protected $fillable = [
        'owner_id',
        'account_id',
        'contact_id',
        'name',
        'stage',
        'meeting_booked_at',
        'meeting_outcome',
        'meeting_outcome_notes',
        'meeting_outcome_at',
        'value',
        'expected_close_date',
        'probability',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_close_date' => 'date',
            'meeting_booked_at' => 'datetime',
            'meeting_outcome_at' => 'datetime',
            'value' => 'decimal:2',
            'probability' => 'integer',
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

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
