<?php

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('setting opportunity disposition on lead with company_name redirects back with open_convert_wizard session key', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'company_name' => 'Tech Corp',
        'pool_assigned_to' => $rep->id,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($rep)->patch(route('leads.pool.disposition', ['contact' => $contact->id]), [
        'disposition' => Contact::DISPOSITION_OPPORTUNITY,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('open_convert_wizard', $contact->id);

    $contact->refresh();
    // Disposition is not changed to opportunity yet (that's done after wizard conversion)
    expect($contact->disposition)->toBe(Contact::DISPOSITION_NEW_LEAD);
});

test('lead without company_name cannot set opportunity disposition', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'company_name' => null,
        'pool_assigned_to' => $rep->id,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($rep)->patch(route('leads.pool.disposition', ['contact' => $contact->id]), [
        'disposition' => Contact::DISPOSITION_OPPORTUNITY,
    ]);

    // Should fail - no company_name
    $response->assertSessionHasErrors('company_name');

    $contact->refresh();
    expect($contact->disposition)->toBe(Contact::DISPOSITION_NEW_LEAD);
});

test('imported contact with company_name is stored correctly', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $contact = Contact::factory()->create([
        'owner_id' => $user->id,
        'company_name' => 'Imported Corp',
    ]);

    $contact->refresh();
    expect($contact->company_name)->toBe('Imported Corp');
});
