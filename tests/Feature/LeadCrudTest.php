<?php

use App\Models\Lead;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['is_approved' => true]);
});

test('lead index page loads', function () {
    $this->actingAs($this->user)
        ->get(route('leads.index'))
        ->assertSuccessful();
});

test('lead create page loads', function () {
    $this->actingAs($this->user)
        ->get(route('leads.create'))
        ->assertSuccessful();
});

test('can create a lead', function () {
    $response = $this->actingAs($this->user)
        ->post(route('leads.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'source_type' => 'website',
            'status' => 'new',
            'priority' => 'cold',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('leads', ['email' => 'jane@example.com', 'created_by' => $this->user->id]);
});

test('store validates required fields', function () {
    $this->actingAs($this->user)
        ->post(route('leads.store'), [])
        ->assertSessionHasErrors(['first_name', 'last_name', 'email', 'source_type']);
});

test('store rejects duplicate email', function () {
    Lead::factory()->create(['email' => 'dup@example.com']);

    $this->actingAs($this->user)
        ->post(route('leads.store'), [
            'first_name' => 'Other',
            'last_name' => 'Person',
            'email' => 'dup@example.com',
            'source_type' => 'website',
            'status' => 'new',
            'priority' => 'cold',
        ])
        ->assertSessionHasErrors('email');
});

test('lead show page loads', function () {
    $lead = Lead::factory()->create();

    $this->actingAs($this->user)
        ->get(route('leads.show', $lead))
        ->assertSuccessful();
});

test('lead edit page loads', function () {
    $lead = Lead::factory()->create();

    $this->actingAs($this->user)
        ->get(route('leads.edit', $lead))
        ->assertSuccessful();
});

test('can update a lead', function () {
    $lead = Lead::factory()->create(['status' => 'new']);

    $this->actingAs($this->user)
        ->patch(route('leads.update', $lead), [
            'first_name' => $lead->first_name,
            'last_name' => $lead->last_name,
            'email' => $lead->email,
            'source_type' => $lead->source_type,
            'status' => 'contacted',
            'priority' => 'warm',
        ]);

    expect($lead->fresh()->status)->toBe('contacted');
    expect($lead->fresh()->priority)->toBe('warm');
});

test('can soft delete a lead', function () {
    $lead = Lead::factory()->create();

    $this->actingAs($this->user)
        ->delete(route('leads.destroy', $lead))
        ->assertRedirect(route('leads.index'));

    $this->assertSoftDeleted('leads', ['id' => $lead->id]);
});

test('unauthenticated user cannot access leads', function () {
    $this->get(route('leads.index'))->assertRedirect('/login');
});
