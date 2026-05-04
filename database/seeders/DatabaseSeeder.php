<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $account = Account::create([
            'owner_id' => $user->id,
            'name' => 'Acme Learning Co.',
            'industry' => 'Education',
            'website' => 'https://example.com',
            'phone' => '+1 555 0100',
            'notes' => 'Interested in student success tools.',
        ]);

        $contact = Contact::create([
            'owner_id' => $user->id,
            'account_id' => $account->id,
            'first_name' => 'Jamie',
            'last_name' => 'Rivera',
            'email' => 'jamie@example.com',
            'phone' => '+1 555 0101',
            'job_title' => 'Operations Lead',
            'status' => 'prospect',
            'notes' => 'Prefers email follow-ups.',
        ]);

        $deal = Deal::create([
            'owner_id' => $user->id,
            'account_id' => $account->id,
            'contact_id' => $contact->id,
            'name' => 'CRM onboarding package',
            'stage' => 'qualified',
            'value' => 4500,
            'expected_close_date' => now()->addWeeks(3)->toDateString(),
            'probability' => 45,
            'notes' => 'Needs pricing confirmation before proposal.',
        ]);

        Activity::create([
            'owner_id' => $user->id,
            'contact_id' => $contact->id,
            'deal_id' => $deal->id,
            'type' => 'task',
            'subject' => 'Send proposal draft',
            'body' => 'Include onboarding timeline and support plan.',
            'due_at' => now()->addDays(2),
        ]);
    }
}
