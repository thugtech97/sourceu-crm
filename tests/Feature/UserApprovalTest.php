<?php

use App\Models\User;
use App\Notifications\UserApprovedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

use function Pest\Laravel\actingAs;

// ── Registration ────────────────────────────────────────────────────────────

test('newly registered user is not approved', function () {
    $this->post('/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect(User::where('email', 'jane@example.com')->first())
        ->is_approved->toBeFalse();
});

test('newly registered user is redirected to verify email', function () {
    $response = $this->post('/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('verification.notice'));
});

// ── Email verification ───────────────────────────────────────────────────────

test('verified but unapproved user is redirected to pending-approval', function () {
    $user = User::factory()->create(['is_approved' => false]);

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)],
    );

    $response = actingAs($user)->get($verificationUrl);

    $response->assertRedirect(route('pending-approval'));
});

test('verified and approved user is redirected to dashboard after verification', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)],
    );

    $response = actingAs($user)->get($verificationUrl);

    $response->assertRedirect(route('dashboard').'?verified=1');
});

// ── Pending approval page ────────────────────────────────────────────────────

test('unapproved user can see pending approval page', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => false,
    ]);

    actingAs($user)->get(route('pending-approval'))->assertOk();
});

test('approved user visiting pending-approval is redirected to dashboard', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => true,
    ]);

    actingAs($user)->get(route('pending-approval'))->assertRedirect(route('crm.dashboard'));
});

// ── Approved middleware gate ─────────────────────────────────────────────────

test('unapproved user cannot access crm routes', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => false,
    ]);

    actingAs($user)->get(route('crm.dashboard'))->assertRedirect(route('pending-approval'));
});

test('approved user can access crm routes', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => true,
    ]);

    actingAs($user)->get(route('crm.dashboard'))->assertOk();
});

test('unverified user cannot access crm routes', function () {
    $user = User::factory()->create([
        'email_verified_at' => null,
        'is_approved' => false,
    ]);

    actingAs($user)->get(route('crm.dashboard'))->assertRedirect(route('verification.notice'));
});

// ── Admin approval ───────────────────────────────────────────────────────────

test('admin can approve a pending user', function () {
    Notification::fake();

    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => true,
        'is_admin' => true,
    ]);

    $pending = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => false,
    ]);

    actingAs($admin)
        ->patch(route('admin.users.approve', $pending))
        ->assertRedirect();

    expect($pending->fresh()->is_approved)->toBeTrue();
    Notification::assertSentTo($pending, UserApprovedNotification::class);
});

test('admin can remove a pending user', function () {
    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => true,
        'is_admin' => true,
    ]);

    $pending = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => false,
    ]);

    actingAs($admin)
        ->delete(route('admin.users.destroy', $pending))
        ->assertRedirect();

    expect(User::find($pending->id))->toBeNull();
});

test('non-admin cannot access admin panel', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'is_approved' => true,
        'is_admin' => false,
    ]);

    actingAs($user)->get(route('admin.users.index'))->assertForbidden();
});
