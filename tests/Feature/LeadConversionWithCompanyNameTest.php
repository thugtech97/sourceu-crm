<?php

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can convert lead with company_name to opportunity without providing account_name', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'company_name' => 'Tech Corp',
        'pool_assigned_to' => $rep->id,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($rep)->patch(route('leads.pool.disposition', ['contact' => $contact->id]), [
        'disposition' => Contact::DISPOSITION_OPPORTUNITY,
        'account_name' => '', // Not required when company_name exists
    ]);

    $response->assertRedirect();

    $contact->refresh();
    expect($contact->disposition)->toBe(Contact::DISPOSITION_OPPORTUNITY);
    expect($contact->account_id)->not->toBeNull();

    $deal = Deal::where('contact_id', $contact->id)->first();
    expect($deal)->not->toBeNull();
    expect($deal->expected_close_date->toDateString())->toBe(today()->toDateString());
});

test('lead converted to opportunity creates account from company_name', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'company_name' => 'Innovation Inc',
        'pool_assigned_to' => $rep->id,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($rep)->patch(route('leads.pool.disposition', ['contact' => $contact->id]), [
        'disposition' => Contact::DISPOSITION_OPPORTUNITY,
    ]);

    $response->assertRedirect();

    $account = Account::where('name', 'Innovation Inc')->first();
    expect($account)->not->toBeNull();
    expect($account->owner_id)->toBe($rep->id);
});

test('lead without company_name cannot be converted to opportunity', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'company_name' => null,
        'pool_assigned_to' => $rep->id,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($rep)->patch(route('leads.pool.disposition', ['contact' => $contact->id]), [
        'disposition' => Contact::DISPOSITION_OPPORTUNITY,
    ]);

    // Should fail - no company_name to create account from
    $response->assertSessionHasErrors();
    
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
