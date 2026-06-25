<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessUnit extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'name',
    ];

    /** @return HasMany<Service> */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
