<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadFieldValue extends Model
{
    use HasUuids;

    protected $fillable = [
        'lead_id',
        'lead_field_id',
        'value',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(LeadField::class, 'lead_field_id');
    }
}
