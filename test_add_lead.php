<?php

use App\Models\Contact;
use App\Models\Account;
use App\Models\User;

// Test adding a lead manually
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Create or get a test user
$user = User::first() ?? User::factory()->create();

// Create or get a test account
$account = Account::factory()->create(['owner_id' => $user->id]);

// Attempt to create a contact
$contact = Contact::create([
    'owner_id' => $user->id,
    'account_id' => $account->id,
    'first_name' => 'Test',
    'last_name' => 'Lead',
    'email' => 'test_' . time() . '@example.com',
    'phone' => '1234567890',
    'status' => 'lead',
    'lead_status' => 'new',
    'disposition' => 'new_lead',
    'pool_team' => 'sales',
    'source_type' => 'inbound',
]);

if ($contact) {
    echo "✅ Contact created successfully with ID: " . $contact->id . "\n";
    echo "Name: " . $contact->first_name . " " . $contact->last_name . "\n";
    echo "Email: " . $contact->email . "\n";
    echo "Status: " . $contact->status . "\n";
    echo "Lead Status: " . $contact->lead_status . "\n";
} else {
    echo "❌ Failed to create contact\n";
}
