<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DncList;
use App\Models\User;
use App\Notifications\LeadExpiredNotification;
use Illuminate\Support\Facades\DB;

class LeadRoutingService
{
    public const ASSIGNMENT_TTL_HOURS = 72;

    /**
     * Route a newly ingested contact into the correct pool.
     * Skips routing if the contact is already on the DNC list.
     */
    public function ingest(Contact $contact, string $sourceType): void
    {
        if (DncList::blocks($contact->phone, $contact->email)) {
            $contact->update([
                'disposition' => Contact::DISPOSITION_DNC,
                'pool_team' => null,
            ]);

            return;
        }

        $team = $sourceType === Contact::SOURCE_COLD
            ? Contact::TEAM_COLD_CALLING
            : Contact::TEAM_SALES;

        $contact->update([
            'source_type' => $sourceType,
            'pool_team' => $team,
            'disposition' => Contact::DISPOSITION_NEW_LEAD,
            'pool_assigned_to' => null,
            'pool_assigned_at' => null,
            'pool_expires_at' => null,
        ]);
    }

    /**
     * Atomically claim a pooled lead for a rep.
     * Uses a raw WHERE assigned_to IS NULL guard to prevent race conditions.
     * Returns true if claim succeeded, false if another rep got there first.
     */
    public function claim(Contact $contact, User $rep): bool
    {
        $affected = DB::table('contacts')
            ->where('id', $contact->id)
            ->whereNull('pool_assigned_to')
            ->whereIn('disposition', [Contact::DISPOSITION_NEW_LEAD, Contact::DISPOSITION_RECYCLED])
            ->update([
                'pool_assigned_to' => $rep->id,
                'pool_assigned_at' => now(),
                'pool_expires_at' => now()->addHours(self::ASSIGNMENT_TTL_HOURS),
                'updated_at' => now(),
            ]);

        return $affected > 0;
    }

    /**
     * Mark a contact as DNC and write them to the DNC list.
     */
    public function markDnc(Contact $contact, User $addedBy, ?string $reason = null): void
    {
        DB::transaction(function () use ($contact, $addedBy, $reason) {
            $contact->update([
                'disposition' => Contact::DISPOSITION_DNC,
                'pool_assigned_to' => null,
                'pool_assigned_at' => null,
                'pool_expires_at' => null,
            ]);

            DncList::firstOrCreate(
                array_filter(['phone' => $contact->phone, 'email' => $contact->email]),
                [
                    'reason' => $reason,
                    'added_by' => $addedBy->id,
                    'contact_id' => $contact->id,
                ]
            );
        });
    }

    /**
     * Release an assigned lead back to its pool (72h expired or rep request).
     */
    public function recycle(Contact $contact): void
    {
        $previousRep = $contact->poolAssignedTo;

        $contact->update([
            'disposition' => Contact::DISPOSITION_RECYCLED,
            'pool_assigned_to' => null,
            'pool_assigned_at' => null,
            'pool_expires_at' => null,
        ]);

        if ($previousRep) {
            $previousRep->notify(new LeadExpiredNotification($contact));
        }
    }

    /**
     * Cold caller hands a converted lead to the inbound sales pool.
     */
    public function handoffToSales(Contact $contact, User $coldCaller): void
    {
        $contact->update([
            'source_type' => Contact::SOURCE_INBOUND,
            'pool_team' => Contact::TEAM_SALES,
            'disposition' => Contact::DISPOSITION_HANDOFF_TO_SALES,
            'converted_by' => $coldCaller->id,
            'pool_assigned_to' => null,
            'pool_assigned_at' => null,
            'pool_expires_at' => null,
        ]);
    }

    /**
     * Enrol a lead in the warm email nurture campaign.
     */
    public function enrollInWarmEmail(Contact $contact): void
    {
        $contact->update([
            'disposition' => Contact::DISPOSITION_WARM_EMAIL,
            'pool_assigned_to' => null,
            'pool_assigned_at' => null,
            'pool_expires_at' => null,
        ]);
    }

    /**
     * Convert a lead to an opportunity (Salesforce-style).
     * Creates or finds an Account, creates a Deal at 'new' stage, and links everything together.
     */
    public function convertToOpportunity(Contact $contact, User $rep, string $accountName): Deal
    {
        return DB::transaction(function () use ($contact, $rep, $accountName) {
            $account = Account::firstOrCreate(
                ['owner_id' => $rep->id, 'name' => $accountName],
            );

            $contact->update([
                'account_id' => $account->id,
                'disposition' => Contact::DISPOSITION_OPPORTUNITY,
                'converted_by' => $rep->id,
                'pool_assigned_to' => null,
                'pool_assigned_at' => null,
                'pool_expires_at' => null,
            ]);

            return Deal::create([
                'owner_id' => $rep->id,
                'contact_id' => $contact->id,
                'account_id' => $account->id,
                'name' => "{$contact->name} — {$accountName}",
                'stage' => Deal::STAGE_NEW,
                'value' => 0,
                'probability' => 20,
            ]);
        });
    }

    /**
     * Fast-track a lead to the pipeline when a meeting is booked.
     * Creates a deal at the meeting_booked stage and cancels the 72h timer.
     */
    public function bookMeeting(Contact $contact, User $rep): Deal
    {
        return DB::transaction(function () use ($contact, $rep) {
            $contact->update([
                'disposition' => Contact::DISPOSITION_MEETING_BOOKED,
                'pool_assigned_to' => null,
                'pool_assigned_at' => null,
                'pool_expires_at' => null,
            ]);

            return Deal::create([
                'owner_id' => $rep->id,
                'contact_id' => $contact->id,
                'account_id' => $contact->account_id,
                'name' => "Meeting: {$contact->name}",
                'stage' => Deal::STAGE_MEETING_BOOKED,
                'meeting_booked_at' => now(),
                'probability' => 30,
            ]);
        });
    }
}
