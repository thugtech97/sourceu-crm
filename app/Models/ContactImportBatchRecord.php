<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactImportBatchRecord extends Model
{
    protected $fillable = [
        'batch_id',
        'row_number',
        'contact_id',
        'status',
        'error_message',
        'data',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'json',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ContactImportBatch::class, 'batch_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isSkipped(): bool
    {
        return $this->status === 'skipped';
    }
}
