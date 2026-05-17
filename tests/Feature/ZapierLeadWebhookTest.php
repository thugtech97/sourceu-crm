<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\User;

test('zapier lead webhook creates a crm contact from parsed email fields', function () {
    config([
        'services.zapier.lead_webhook_secret' => 'super-secret',
        'services.zapier.lead_owner_email' => 'jude@sourceu.ai',
    ]);

    $owner = User::factory()->create(['email' => 'jude@sourceu.ai']);

    $this->postJson('/webhooks/zapier/leads', [
        'source' => 'Comparefirst',
        'full_name' => 'Hoa Phung',
        'email' => 'hoa.phung@hotmail.com',
        'phone' => '+61451188910',
        'role' => 'Admin',
        'budget' => '$1000 -$1500 per month',
        'region' => 'Latin America',
        'message' => 'Dental admin thank you',
        'state' => 'Australia',
        'form_name' => 'SourceU v2',
    ], [
        'X-SourceU-Webhook-Secret' => 'super-secret',
    ])->assertOk()
        ->assertJsonPath('message', 'Lead saved.');

    $contact = Contact::query()->firstOrFail();

    expect($contact)
        ->owner_id->toBe($owner->id)
        ->first_name->toBe('Hoa')
        ->last_name->toBe('Phung')
        ->email->toBe('hoa.phung@hotmail.com')
        ->phone->toBe('+61451188910')
        ->job_title->toBe('Admin')
        ->status->toBe('lead')
        ->and($contact->notes)->toContain('Comparefirst')
        ->and($contact->notes)->toContain('Dental admin thank you');

    expect(Activity::query()->where('contact_id', $contact->id)->exists())->toBeTrue();
});

test('zapier lead webhook rejects invalid secrets', function () {
    config(['services.zapier.lead_webhook_secret' => 'super-secret']);

    User::factory()->create();

    $this->postJson('/webhooks/zapier/leads', [
        'full_name' => 'Hoa Phung',
    ], [
        'X-SourceU-Webhook-Secret' => 'wrong',
    ])->assertForbidden();

    expect(Contact::query()->count())->toBe(0);
});
