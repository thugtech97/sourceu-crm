<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /** @var list<string> */
    protected $fillable = [
        'name',
        'email',
        'dialpad_user_id',
        'dialpad_number',
        'dialpad_connected',
        'is_approved',
        'is_admin',
        'password',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'dialpad_connected' => 'boolean',
            'is_approved' => 'boolean',
            'is_admin' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /** @param Builder<User> $query */
    public function scopePendingApproval(Builder $query): void
    {
        $query->whereNotNull('email_verified_at')->where('is_approved', false);
    }
}
