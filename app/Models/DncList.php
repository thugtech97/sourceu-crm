<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class DncList extends Model implements Auditable
{
    use AuditableTrait;

    protected $table = 'dnc_list';

    protected $fillable = [
        'phone',
        'email',
        'reason',
        'added_by',
        'contact_id',
    ];

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public static function blocksPhone(?string $phone): bool
    {
        if (! $phone) {
            return false;
        }

        return static::where('phone', $phone)->exists();
    }

    public static function blocksEmail(?string $email): bool
    {
        if (! $email) {
            return false;
        }

        return static::where('email', $email)->exists();
    }

    public static function blocks(?string $phone, ?string $email): bool
    {
        return static::blocksPhone($phone) || static::blocksEmail($email);
    }
}
