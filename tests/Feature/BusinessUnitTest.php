<?php

use App\Models\BusinessUnit;
use App\Models\Service;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['is_approved' => true]);
    $this->actingAs($this->user);
});

test('can list all business units', function () {
    $units = BusinessUnit::factory(3)->create();

    $response = $this->getJson('/business-units');

    $response->assertStatus(200)
        ->assertJsonCount(3)
        ->assertJsonFragment(['name' => $units[0]->name]);
});

test('can create a business unit', function () {
    $response = $this->postJson('/business-units', [
        'name' => 'Enterprise Solutions',
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Enterprise Solutions']);

    $this->assertDatabaseHas('business_units', [
        'name' => 'Enterprise Solutions',
    ]);
});

test('cannot create business unit with duplicate name', function () {
    BusinessUnit::factory()->create(['name' => 'Duplicate']);

    $response = $this->postJson('/business-units', [
        'name' => 'Duplicate',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('name');
});

test('can get services for a business unit', function () {
    $unit = BusinessUnit::factory()->create();
    $services = Service::factory(2)->create(['business_unit_id' => $unit->id]);

    $response = $this->getJson("/business-units/{$unit->id}/services");

    $response->assertStatus(200)
        ->assertJsonCount(2)
        ->assertJsonFragment(['name' => $services[0]->name]);
});

test('can delete a business unit', function () {
    $unit = BusinessUnit::factory()->create();

    $response = $this->deleteJson("/business-units/{$unit->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('business_units', ['id' => $unit->id]);
});

test('can create a service for a business unit', function () {
    $unit = BusinessUnit::factory()->create();

    $response = $this->postJson('/services', [
        'business_unit_id' => $unit->id,
        'name' => 'Technical Support',
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Technical Support']);

    $this->assertDatabaseHas('services', [
        'business_unit_id' => $unit->id,
        'name' => 'Technical Support',
    ]);
});

test('can delete a service', function () {
    $unit = BusinessUnit::factory()->create();
    $service = Service::factory()->create(['business_unit_id' => $unit->id]);

    $response = $this->deleteJson("/services/{$service->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('services', ['id' => $service->id]);
});
