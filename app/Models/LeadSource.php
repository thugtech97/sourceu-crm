<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadSource extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = ['owner_id', 'name'];

    /**
     * Get the user who owns this lead source.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the contacts associated with this lead source.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }
}
