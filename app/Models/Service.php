<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'business_unit_id',
        'name',
    ];

    /** @return BelongsTo<BusinessUnit, $this> */
    public function businessUnit(): BelongsTo
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    /** @return HasMany<ServiceInterestContact> */
    public function serviceInterests(): HasMany
    {
        return $this->hasMany(ServiceInterestContact::class);
    }
}
