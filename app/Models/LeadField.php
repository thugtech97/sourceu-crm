<?php

namespace App\Models;

use Database\Factories\LeadFieldFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadField extends Model
{
    /** @use HasFactory<LeadFieldFactory> */
    use HasFactory;

    use HasUuids;

    protected $fillable = [
        'section',
        'label',
        'key',
        'type',
        'options',
        'placeholder',
        'required',
        'show_on_list',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'required' => 'boolean',
            'show_on_list' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(LeadFieldValue::class);
    }

    public static function active(): Builder
    {
        return static::where('is_active', true)->orderBy('sort_order');
    }
}
