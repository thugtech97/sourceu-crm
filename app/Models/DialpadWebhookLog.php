<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DialpadWebhookLog extends Model
{
    protected $fillable = [
        'dialpad_call_id',
        'event_type',
        'payload',
        'processed',
        'error',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed' => 'boolean',
        ];
    }
}
