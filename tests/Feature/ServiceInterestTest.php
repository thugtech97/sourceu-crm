<?php

use App\Models\BusinessUnit;
use App\Models\Contact;
use App\Models\Service;
use App\Models\ServiceInterestContact;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['is_approved' => true]);
    $this->actingAs($this->user);
    $this->contact = Contact::factory()->create(['owner_id' => $this->user->id]);
});

test('can get service interests for a contact', function () {
    $unit = BusinessUnit::factory()->create();
    $services = Service::factory(2)->create(['business_unit_id' => $unit->id]);

    $this->contact->serviceInterests()->createMany([
        [
            'service_id' => $services[0]->id,
            'description' => 'Interested in this service',
        ],
        [
            'service_id' => $services[1]->id,
            'description' => 'Also interested in this one',
        ],
    ]);

    $response = $this->getJson("/contacts/{$this->contact->id}/service-interests");

    $response->assertStatus(200)
        ->assertJsonCount(2)
        ->assertJsonFragment(['description' => 'Interested in this service']);
});

test('can store service interests for a contact', function () {
    $unit = BusinessUnit::factory()->create();
    $services = Service::factory(2)->create(['business_unit_id' => $unit->id]);

    $response = $this->postJson(
        "/contacts/{$this->contact->id}/service-interests",
        [
            'service_ids' => [$services[0]->id, $services[1]->id],
            'description' => 'Customer is interested in multiple services',
        ],
    );

    $response->assertStatus(201)
        ->assertJsonCount(2);

    $this->assertDatabaseHas('service_interest_contacts', [
        'contact_id' => $this->contact->id,
        'service_id' => $services[0]->id,
        'description' => 'Customer is interested in multiple services',
    ]);

    $this->assertDatabaseHas('service_interest_contacts', [
        'contact_id' => $this->contact->id,
        'service_id' => $services[1]->id,
        'description' => 'Customer is interested in multiple services',
    ]);
});

test('can delete a service interest', function () {
    $unit = BusinessUnit::factory()->create();
    $service = Service::factory()->create(['business_unit_id' => $unit->id]);

    ServiceInterestContact::factory()->create([
        'contact_id' => $this->contact->id,
        'service_id' => $service->id,
    ]);

    $response = $this->deleteJson(
        "/contacts/{$this->contact->id}/service-interests/{$service->id}",
    );

    $response->assertStatus(204);
    $this->assertDatabaseMissing('service_interest_contacts', [
        'contact_id' => $this->contact->id,
        'service_id' => $service->id,
    ]);
});

test('replaces existing service interests when storing new ones', function () {
    $unit = BusinessUnit::factory()->create();
    $services = Service::factory(3)->create(['business_unit_id' => $unit->id]);

    // Create initial interests
    $this->contact->serviceInterests()->createMany([
        ['service_id' => $services[0]->id],
        ['service_id' => $services[1]->id],
    ]);

    // Store new interests (should replace old ones)
    $this->postJson(
        "/contacts/{$this->contact->id}/service-interests",
        [
            'service_ids' => [$services[2]->id],
            'description' => 'New interests',
        ],
    );

    $this->assertDatabaseMissing('service_interest_contacts', [
        'contact_id' => $this->contact->id,
        'service_id' => $services[0]->id,
    ]);

    $this->assertDatabaseHas('service_interest_contacts', [
        'contact_id' => $this->contact->id,
        'service_id' => $services[2]->id,
    ]);
});

test('validates service IDs exist when storing interests', function () {
    $response = $this->postJson(
        "/contacts/{$this->contact->id}/service-interests",
        [
            'service_ids' => [99999],
        ],
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors('service_ids.0');
});
