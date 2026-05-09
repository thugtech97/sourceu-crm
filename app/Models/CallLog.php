<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallLog extends Model
{
    protected $fillable = [
        'contact_id',
        'user_id',
        'dialpad_call_id',
        'dialpad_user_id',
        'direction',
        'status',
        'duration_seconds',
        'recording_url',
        'transcript_url',
        'transcript_text',
        'disposition_set',
        'dialpad_payload',
        'started_at',
        'connected_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'dialpad_payload' => 'array',
            'disposition_set' => 'boolean',
            'started_at' => 'datetime',
            'connected_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
