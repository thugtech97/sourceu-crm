<?php

use App\Models\Lead;
use App\Models\LeadField;
use App\Models\LeadFieldValue;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['is_approved' => true]);
});

test('lead fields settings page loads', function () {
    $this->actingAs($this->user)
        ->get(route('lead-fields.index'))
        ->assertSuccessful();
});

test('can create a lead field', function () {
    $this->actingAs($this->user)
        ->post(route('lead-fields.store'), [
            'section' => 'qualification',
            'label' => 'Decision Deadline',
            'key' => 'decision_deadline',
            'type' => 'date',
            'required' => false,
            'show_on_list' => false,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('lead_fields', [
        'key' => 'decision_deadline',
        'section' => 'qualification',
        'type' => 'date',
    ]);
});

test('lead field key must be unique', function () {
    LeadField::factory()->create(['key' => 'my_key']);

    $this->actingAs($this->user)
        ->post(route('lead-fields.store'), [
            'section' => 'general',
            'label' => 'My Key',
            'key' => 'my_key',
            'type' => 'text',
            'required' => false,
            'show_on_list' => false,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('key');
});

test('can update a lead field', function () {
    $field = LeadField::factory()->create(['label' => 'Old Label']);

    $this->actingAs($this->user)
        ->patch(route('lead-fields.update', $field), [
            'section' => $field->section,
            'label' => 'New Label',
            'key' => $field->key,
            'type' => $field->type,
            'required' => false,
            'show_on_list' => false,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect($field->fresh()->label)->toBe('New Label');
});

test('can delete a lead field', function () {
    $field = LeadField::factory()->create();

    $this->actingAs($this->user)
        ->delete(route('lead-fields.destroy', $field))
        ->assertRedirect();

    $this->assertDatabaseMissing('lead_fields', ['id' => $field->id]);
});

test('custom field value is saved when creating a lead', function () {
    $field = LeadField::factory()->create(['type' => 'text', 'is_active' => true]);

    $this->actingAs($this->user)
        ->post(route('leads.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'source_type' => 'website',
            'status' => 'new',
            'priority' => 'cold',
            'custom_fields' => [$field->id => 'some value'],
        ])
        ->assertRedirect();

    $lead = Lead::where('email', 'jane@example.com')->first();

    expect($lead)->not->toBeNull();

    $this->assertDatabaseHas('lead_field_values', [
        'lead_id' => $lead->id,
        'lead_field_id' => $field->id,
        'value' => 'some value',
    ]);
});

test('custom field value is updated when editing a lead', function () {
    $lead = Lead::factory()->create(['created_by' => $this->user->id]);
    $field = LeadField::factory()->create(['type' => 'text', 'is_active' => true]);
    LeadFieldValue::create(['lead_id' => $lead->id, 'lead_field_id' => $field->id, 'value' => 'old']);

    $this->actingAs($this->user)
        ->patch(route('leads.update', $lead), [
            'first_name' => $lead->first_name,
            'last_name' => $lead->last_name,
            'email' => $lead->email,
            'source_type' => $lead->source_type,
            'status' => $lead->status,
            'priority' => $lead->priority,
            'custom_fields' => [$field->id => 'updated value'],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('lead_field_values', [
        'lead_id' => $lead->id,
        'lead_field_id' => $field->id,
        'value' => 'updated value',
    ]);
});

test('select field stores options as json', function () {
    $this->actingAs($this->user)
        ->post(route('lead-fields.store'), [
            'section' => 'general',
            'label' => 'Stage',
            'key' => 'stage',
            'type' => 'select',
            'options' => ['Early', 'Mid', 'Late'],
            'required' => false,
            'show_on_list' => false,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertRedirect();

    $field = LeadField::where('key', 'stage')->first();
    expect($field->options)->toBe(['Early', 'Mid', 'Late']);
});
