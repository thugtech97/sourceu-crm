<?php

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can create contact with unique email', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->post('/contacts', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'phone' => '555-0000',
        'job_title' => 'Developer',
        'status' => 'lead',
        'source_type' => 'inbound',
        'notes' => '',
    ]);

    $response->assertRedirect('/contacts');
    expect(Contact::where('email', 'john@example.com')->count())->toBe(1);
});

test('returns error when creating contact with duplicate email', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    // Create first contact with email
    Contact::factory()->create([
        'email' => 'duplicate@example.com',
        'owner_id' => $user->id,
    ]);

    // Attempt to create second contact with same email
    $response = $this->actingAs($user)->post('/contacts', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'duplicate@example.com',
        'phone' => '555-0001',
        'job_title' => 'Manager',
        'status' => 'prospect',
        'notes' => '',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('email');

    // Verify only one contact with this email exists
    expect(Contact::where('email', 'duplicate@example.com')->count())->toBe(1);
});

test('can create multiple contacts with empty email', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    // Create first contact with no email
    $response1 = $this->actingAs($user)->post('/contacts', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => '',
        'phone' => '555-0000',
        'job_title' => 'Developer',
        'status' => 'lead',
        'source_type' => 'inbound',
        'notes' => '',
    ]);

    // Create second contact with no email
    $response2 = $this->actingAs($user)->post('/contacts', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => '',
        'phone' => '555-0001',
        'job_title' => 'Manager',
        'status' => 'prospect',
        'notes' => '',
    ]);

    $response1->assertRedirect('/contacts');
    $response2->assertRedirect('/contacts');
    expect(Contact::whereNull('email')->orWhere('email', '')->count())->toBe(2);
});
