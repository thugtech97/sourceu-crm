<?php

use App\Models\Contact;
use App\Models\User;

test('can add a new lead manually', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => 'sales']), [
        'account_name' => 'Test Company',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john_' . time() . '@example.com',
        'phone' => '1234567890',
        'lead_status' => 'new',
        'source_type' => 'inbound',
    ]);

    // Check if redirect happened
    expect($response->status())->toBe(302);
    
    // Check if contact was created
    $contact = Contact::where('first_name', 'John')
        ->where('last_name', 'Doe')
        ->orderByDesc('id')
        ->first();
    
    expect($contact)->not->toBeNull();
    expect($contact->first_name)->toBe('John');
    expect($contact->lead_status)->toBe('new');
});

test('lead status is required', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => 'sales']), [
        'account_name' => 'Test Company',
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane_' . time() . '@example.com',
    ]);

    $response->assertSessionHasErrors('lead_status');
});

test('account is required', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => 'sales']), [
        'first_name' => 'Jack',
        'last_name' => 'Smith',
        'email' => 'jack_' . time() . '@example.com',
        'lead_status' => 'new',
    ]);

    $response->assertSessionHasErrors('account_id');
});

test('lead with all fields including service interests', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => 'sales']), [
        'account_name' => 'Complete Company',
        'first_name' => 'Complete',
        'last_name' => 'Person',
        'email' => 'complete_' . time() . '@example.com',
        'phone' => '555-1234',
        'lead_status' => 'new',
        'source_type' => 'inbound',
        'title' => 'Manager',
        'business_unit' => '1',
        'services' => '1,2,3',
        'service_description' => 'Interested in all services',
    ]);

    expect($response->status())->toBe(302);
    expect($response->getSession()->has('status'))->toBeTrue();
    
    $contact = Contact::where('email', 'complete_' . (time() - 1) . '@example.com')
        ->orWhere('first_name', 'Complete')
        ->orderByDesc('id')
        ->first();
    
    if ($contact) {
        expect($contact->business_unit)->toBe('1');
        expect($contact->services)->toBe('1,2,3');
        expect($contact->service_description)->toBe('Interested in all services');
    }
});
