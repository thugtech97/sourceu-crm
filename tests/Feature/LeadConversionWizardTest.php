<?php

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can retrieve conversion pre-fill data', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'salutation' => 'Mr',
        'first_name' => 'John',
        'middle_name' => 'Robert',
        'last_name' => 'Doe',
        'suffix' => 'Jr',
        'company_name' => 'Acme Corp',
        'pool_assigned_to' => $rep->id,
        'lead_owner' => 'Jane Agent',
    ]);

    $response = $this->actingAs($rep)->get(route('leads.pool.conversion-data', ['contact' => $contact->id]));

    $response->assertOk();
    $response->assertJson([
        'contact' => [
            'id' => $contact->id,
            'salutation' => 'Mr',
            'first_name' => 'John',
            'middle_name' => 'Robert',
            'last_name' => 'Doe',
            'suffix' => 'Jr',
            'lead_owner' => 'Jane Agent',
        ],
        'account' => [
            'id' => null,
            'name' => 'Acme Corp',
            'business_type' => null,
        ],
    ]);
});

test('cannot retrieve conversion pre-fill data if lead is not assigned to current user', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $otherRep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'pool_assigned_to' => $otherRep->id,
    ]);

    $response = $this->actingAs($rep)->get(route('leads.pool.conversion-data', ['contact' => $contact->id]));

    $response->assertForbidden();
});

test('can convert lead to opportunity using wizard payload', function () {
    $rep = User::factory()->create(['is_approved' => true]);
    $contact = Contact::factory()->create([
        'salutation' => 'Mr',
        'first_name' => 'John',
        'middle_name' => 'Robert',
        'last_name' => 'Doe',
        'suffix' => 'Jr',
        'company_name' => 'Acme Corp',
        'pool_assigned_to' => $rep->id,
        'disposition' => Contact::DISPOSITION_NEW_LEAD,
    ]);

    $response = $this->actingAs($rep)->post(route('leads.pool.convert', ['contact' => $contact->id]), [
        'account_name' => 'Acme Corporation Ltd',
        'account_business_type' => 'Client/Participant',
        'salutation' => 'Dr',
        'first_name' => 'Johnny',
        'middle_name' => 'R.',
        'last_name' => 'Doe-Smith',
        'suffix' => 'Sr',
        'opportunity_name' => 'Acme - Big NDIS Deal',
        'record_type' => 'NDIS Accommodation',
    ]);

    // Should redirect to deals.edit
    $contact->refresh();
    $deal = Deal::where('contact_id', $contact->id)->first();
    expect($deal)->not->toBeNull();

    $response->assertRedirect(route('deals.edit', $deal));

    // Assert Account is created with updated fields
    $account = Account::find($contact->account_id);
    expect($account)->not->toBeNull();
    expect($account->name)->toBe('Acme Corporation Ltd');
    expect($account->business_type)->toBe('Client/Participant');
    expect($account->owner_id)->toBe($rep->id);

    // Assert Contact is updated with wizard names
    expect($contact->salutation)->toBe('Dr');
    expect($contact->first_name)->toBe('Johnny');
    expect($contact->middle_name)->toBe('R.');
    expect($contact->last_name)->toBe('Doe-Smith');
    expect($contact->suffix)->toBe('Sr');
    expect($contact->disposition)->toBe(Contact::DISPOSITION_OPPORTUNITY);
    expect($contact->pool_assigned_to)->toBeNull();

    // Assert Deal is created with wizard name and record type
    expect($deal->name)->toBe('Acme - Big NDIS Deal');
    expect($deal->record_type)->toBe('NDIS Accommodation');
    expect($deal->owner_id)->toBe($rep->id);
    expect($deal->account_id)->toBe($account->id);
    expect($deal->stage)->toBe(Deal::STAGE_NEW);
});
