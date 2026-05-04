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

    protected $fillable = [
        'owner_id',
        'account_id',
        'contact_id',
        'name',
        'stage',
        'value',
        'expected_close_date',
        'probability',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_close_date' => 'date',
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
