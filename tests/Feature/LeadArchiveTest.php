<?php

use App\Models\Contact;
use App\Models\User;

test('user can archive a claimed lead with a reason', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $contact = Contact::factory()->create([
        'pool_team' => Contact::TEAM_SALES,
        'pool_assigned_to' => $user->id,
        'pool_assigned_at' => now(),
        'pool_expires_at' => now()->addHours(24),
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($user)
        ->patch("/leads/pool/{$contact->id}/archive", [
            'reason' => 'not_interested',
        ]);

    $response->assertRedirect(route('leads.pool.index'));
    $response->assertSessionHas('status', 'Lead archived successfully.');

    $contact->refresh();
    expect($contact->archived_at)->not()->toBeNull();
    expect($contact->archive_reason)->toBe('not_interested');
    expect($contact->pool_assigned_to)->toBe($user->id); // Still owned by user
    expect($contact->pool_assigned_at)->toBeNull();
    expect($contact->pool_expires_at)->toBeNull();
});

test('user cannot archive a lead they do not own', function () {
    $user1 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $user2 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $contact = Contact::factory()->create([
        'pool_team' => Contact::TEAM_SALES,
        'pool_assigned_to' => $user2->id,
        'pool_assigned_at' => now(),
        'pool_expires_at' => now()->addHours(24),
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($user1)
        ->patch("/leads/pool/{$contact->id}/archive", [
            'reason' => 'not_interested',
        ]);

    $response->assertForbidden();

    $contact->refresh();
    expect($contact->archived_at)->toBeNull();
    expect($contact->archive_reason)->toBeNull();
});

test('archive reason is required', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $contact = Contact::factory()->create([
        'pool_team' => Contact::TEAM_SALES,
        'pool_assigned_to' => $user->id,
        'pool_assigned_at' => now(),
        'pool_expires_at' => now()->addHours(24),
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($user)
        ->patch("/leads/pool/{$contact->id}/archive", [
            'reason' => '',
        ]);

    $response->assertSessionHasErrors('reason');

    $contact->refresh();
    expect($contact->archived_at)->toBeNull();
});

test('archive reason has maximum length', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $contact = Contact::factory()->create([
        'pool_team' => Contact::TEAM_SALES,
        'pool_assigned_to' => $user->id,
        'pool_assigned_at' => now(),
        'pool_expires_at' => now()->addHours(24),
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($user)
        ->patch("/leads/pool/{$contact->id}/archive", [
            'reason' => str_repeat('a', 256),
        ]);

    $response->assertSessionHasErrors('reason');

    $contact->refresh();
    expect($contact->archived_at)->toBeNull();
});

test('user can restore an archived lead', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $contact = Contact::factory()->create([
        'pool_team' => Contact::TEAM_SALES,
        'pool_assigned_to' => $user->id,
        'pool_assigned_at' => now(),
        'pool_expires_at' => now()->addHours(24),
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
        'archived_at' => now()->subHours(1),
        'archive_reason' => 'not_interested',
        'archived_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->patch("/leads/pool/{$contact->id}/restore");

    $response->assertRedirect(route('leads.pool.index'));
    $response->assertSessionHas('status', 'Lead restored to pool successfully.');

    $contact->refresh();
    expect($contact->archived_at)->toBeNull();
    expect($contact->archive_reason)->toBeNull();
    expect($contact->pool_assigned_to)->toBe($user->id);
    expect($contact->pool_assigned_at)->not()->toBeNull();
    expect($contact->pool_expires_at)->not()->toBeNull();
});

test('user cannot restore a lead they do not own', function () {
    $user1 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $user2 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $contact = Contact::factory()->create([
        'pool_team' => Contact::TEAM_SALES,
        'pool_assigned_to' => $user2->id,
        'pool_assigned_at' => now(),
        'pool_expires_at' => now()->addHours(24),
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
        'archived_at' => now()->subHours(1),
        'archive_reason' => 'not_interested',
    ]);

    $response = $this->actingAs($user1)
        ->patch("/leads/pool/{$contact->id}/restore");

    $response->assertForbidden();

    $contact->refresh();
    expect($contact->archived_at)->not()->toBeNull();
    expect($contact->archive_reason)->toBe('not_interested');
});
