<?php

use App\Models\Contact;
use App\Models\User;

test('authenticated user can add a lead manually to the pool', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => Contact::TEAM_SALES]), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'phone' => '+1 (555) 123-4567',
        'account_name' => 'Test Account',
        'lead_status' => 'New Lead',
        'notes' => 'Test lead',
        'source_type' => Contact::SOURCE_INBOUND,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', 'Lead added to pool successfully.');

    $this->assertDatabaseHas('contacts', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'pool_team' => Contact::TEAM_SALES,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
        'owner_id' => $user->id,
    ]);
});

test('first name is required when adding a lead manually', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => Contact::TEAM_SALES]), [
        'first_name' => '',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
    ]);

    $response->assertSessionHasErrors('first_name');
});

test('last name is required when adding a lead manually', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => Contact::TEAM_SALES]), [
        'first_name' => 'John',
        'last_name' => '',
        'email' => 'john@example.com',
    ]);

    $response->assertSessionHasErrors('last_name');
});

test('email must be unique when adding a lead manually', function () {
    $user = User::factory()->create(['is_approved' => true]);
    Contact::factory()->create(['email' => 'john@example.com']);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => Contact::TEAM_SALES]), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
    ]);

    $response->assertSessionHasErrors('email');
});

test('email must be valid when adding a lead manually', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => Contact::TEAM_SALES]), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'invalid-email',
    ]);

    $response->assertSessionHasErrors('email');
});

test('source type must be valid when adding a lead manually', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $response = $this->actingAs($user)->post(route('leads.pool.add', ['team' => Contact::TEAM_SALES]), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'source_type' => 'invalid_source',
    ]);

    $response->assertSessionHasErrors('source_type');
});

test('authenticated user can edit a lead', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create(['first_name' => 'John', 'email' => 'john@example.com']);

    $response = $this->actingAs($user)->put(route('leads.pool.edit', ['contact' => $contact->id]), [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@example.com',
        'phone' => '+1 (555) 987-6543',
        'account_name' => 'Updated Account',
        'lead_status' => 'In Progress',
        'notes' => 'Updated notes',
        'source_type' => Contact::SOURCE_COLD,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', 'Lead updated successfully.');

    $this->assertDatabaseHas('contacts', [
        'id' => $contact->id,
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@example.com',
        'phone' => '+1 (555) 987-6543',
        'notes' => 'Updated notes',
        'source_type' => Contact::SOURCE_COLD,
    ]);
});

test('authenticated user can edit a lead service interest values', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'first_name' => 'Service',
        'last_name' => 'Interest',
        'email' => 'service@example.com',
        'lead_status' => 'new',
        'source_type' => Contact::SOURCE_INBOUND,
    ]);

    $response = $this->actingAs($user)->put(route('leads.pool.edit', ['contact' => $contact->id]), [
        'first_name' => 'Service',
        'last_name' => 'Interest',
        'email' => 'service@example.com',
        'account_name' => 'Service Account',
        'lead_status' => 'new',
        'source_type' => Contact::SOURCE_INBOUND,
        'business_unit' => '7',
        'services' => '5,6',
        'service_description' => 'Updated interest notes',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', 'Lead updated successfully.');

    $this->assertDatabaseHas('contacts', [
        'id' => $contact->id,
        'business_unit' => '7',
        'services' => '5,6',
        'service_description' => 'Updated interest notes',
    ]);
});

test('email must be unique when editing a lead, excluding the current contact', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $contact1 = Contact::factory()->create(['email' => 'jane@example.com']);
    $contact2 = Contact::factory()->create(['email' => 'john@example.com']);

    $response = $this->actingAs($user)->put(route('leads.pool.edit', ['contact' => $contact2->id]), [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@example.com',  // Already used by contact1
    ]);

    $response->assertSessionHasErrors('email');
});

test('user can keep the same email when editing a lead', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create(['email' => 'john@example.com']);

    $response = $this->actingAs($user)->put(route('leads.pool.edit', ['contact' => $contact->id]), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',  // Same email
        'phone' => '+1 (555) 123-4567',
        'account_name' => 'Test Account',
        'lead_status' => 'New Lead',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('status', 'Lead updated successfully.');

    $this->assertDatabaseHas('contacts', [
        'id' => $contact->id,
        'email' => 'john@example.com',
    ]);
});
