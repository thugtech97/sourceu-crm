<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Services\LeadRoutingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeadPoolController extends Controller
{
    public function __construct(private readonly LeadRoutingService $router) {}

    public function index(Request $request): Response
    {
        $team = $request->string('team', Contact::TEAM_SALES)->toString();
        $userId = $request->user()->id;

        $poolQuery = Contact::query()
            ->with('account:id,name')
            ->where('pool_team', $team)
            ->whereNull('pool_assigned_to')
            ->whereNull('archived_at')
            ->whereIn('disposition', [Contact::DISPOSITION_NEW_LEAD, Contact::DISPOSITION_RECYCLED])
            ->latest();

        $myLeadsQuery = Contact::query()
            ->with('account:id,name')
            ->where('pool_team', $team)
            ->where('pool_assigned_to', $userId)
            ->whereNull('archived_at')
            ->whereIn('disposition', [
                Contact::DISPOSITION_NEW_LEAD,
                Contact::DISPOSITION_RECYCLED,
                Contact::DISPOSITION_MEETING_BOOKED,
                Contact::DISPOSITION_WARM_EMAIL,
            ])
            ->latest('pool_assigned_at');

        $archivedQuery = Contact::query()
            ->with(['account:id,name', 'archivedBy:id,name'])
            ->where('pool_team', $team)
            ->where('archived_by', $userId)
            ->whereNotNull('archived_at')
            ->latest('archived_at');

        return Inertia::render('crm/leads/pool', [
            'pool' => $poolQuery->paginate(20, pageName: 'pool_page')->withQueryString(),
            'myLeads' => $myLeadsQuery->paginate(20, pageName: 'my_page')->withQueryString(),
            'archived' => $archivedQuery->paginate(20, pageName: 'archive_page')->withQueryString(),
            'team' => $team,
            'teams' => [
                ['value' => Contact::TEAM_SALES, 'label' => 'Inbound Sales'],
                ['value' => Contact::TEAM_COLD_CALLING, 'label' => 'Cold Calling'],
            ],
        ]);
    }

    public function claim(Request $request, Contact $contact): RedirectResponse
    {
        $claimed = $this->router->claim($contact, $request->user());

        return back()->with(
            $claimed ? 'status' : 'error',
            $claimed ? 'Lead claimed successfully.' : 'Lead was already claimed by another rep.',
        );
    }

    public function bulkClaim(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'contact_ids' => ['required', 'array', 'min:1'],
            'contact_ids.*' => ['integer', 'exists:contacts,id'],
        ]);

        $contacts = Contact::whereIn('id', $validated['contact_ids'])->get();
        $user = $request->user();
        $claimed = 0;
        $failed = 0;

        foreach ($contacts as $contact) {
            if ($this->router->claim($contact, $user)) {
                $claimed++;
            } else {
                $failed++;
            }
        }

        $message = $claimed > 0
            ? "$claimed lead(s) claimed successfully.".($failed > 0 ? " $failed failed." : '')
            : 'No leads could be claimed.';

        return back()->with(
            $claimed > 0 ? 'status' : 'error',
            $message,
        );
    }

    public function setDisposition(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->pool_assigned_to === $request->user()->id, 403);

        $data = $request->validate([
            'disposition' => ['required', Rule::in([
                Contact::DISPOSITION_OPPORTUNITY,
                Contact::DISPOSITION_WARM_EMAIL,
                Contact::DISPOSITION_HANDOFF_TO_SALES,
                Contact::DISPOSITION_MEETING_BOOKED,
                'archive',
            ])],
            'archive_reason' => [
                $request->input('disposition') === 'archive' ? 'required' : 'nullable',
                'string',
                'max:500',
            ],
            'account_name' => [
                $request->input('disposition') === Contact::DISPOSITION_OPPORTUNITY ? 'required' : 'nullable',
                'string',
                'max:255',
            ],
        ]);

        $user = $request->user();

        if ($data['disposition'] === Contact::DISPOSITION_OPPORTUNITY) {
            $deal = $this->router->convertToOpportunity($contact, $user, $data['account_name']);

            return to_route('deals.edit', $deal)->with('status', 'Lead converted to opportunity.');
        }

        if ($data['disposition'] === 'archive') {
            $contact->update([
                'archived_at' => now(),
                'archive_reason' => $data['archive_reason'],
                'archived_by' => $user->id,
                'pool_assigned_to' => null,
                'pool_assigned_at' => null,
                'pool_expires_at' => null,
            ]);

            return to_route('leads.pool.index')->with('status', 'Lead archived.');
        }

        if ($data['disposition'] === Contact::DISPOSITION_HANDOFF_TO_SALES) {
            $this->router->handoffToSales($contact, $user);
        } elseif ($data['disposition'] === Contact::DISPOSITION_WARM_EMAIL) {
            // Keep in My Leads with warm_email disposition
            $contact->update(['disposition' => Contact::DISPOSITION_WARM_EMAIL]);
        } elseif ($data['disposition'] === Contact::DISPOSITION_MEETING_BOOKED) {
            // Keep in My Leads with meeting_booked disposition
            $contact->update(['disposition' => Contact::DISPOSITION_MEETING_BOOKED]);
        }

        return to_route('leads.pool.index')->with('status', 'Lead updated.');
    }

    public function release(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->pool_assigned_to === $request->user()->id, 403);

        $contact->update([
            'pool_assigned_to' => null,
            'pool_assigned_at' => null,
            'pool_expires_at' => null,
        ]);

        return to_route('leads.pool.index')->with('status', 'Lead released back to pool.');
    }

    public function archive(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->pool_assigned_to === $request->user()->id, 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $contact->update([
            'archived_at' => now(),
            'archive_reason' => $validated['reason'],
            'archived_by' => $request->user()->id,
            'pool_assigned_at' => null,
            'pool_expires_at' => null,
        ]);

        return to_route('leads.pool.index')->with('status', 'Lead archived successfully.');
    }

    public function restore(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->archived_by === $request->user()->id, 403);

        $contact->update([
            'archived_at' => null,
            'archive_reason' => null,
            'archived_by' => null,
            'pool_assigned_to' => $request->user()->id,
            'pool_assigned_at' => now(),
            'pool_expires_at' => now()->addHours(24),
        ]);

        return to_route('leads.pool.index')->with('status', 'Lead restored to pool successfully.');
    }

    public function addManually(Request $request): RedirectResponse
    {
        $team = $request->string('team', Contact::TEAM_SALES)->toString();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:contacts,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'source_type' => ['nullable', Rule::in([Contact::SOURCE_INBOUND, Contact::SOURCE_COLD])],
        ]);

        $contact = Contact::create([
            ...$validated,
            'owner_id' => $request->user()->id,
            'pool_team' => $team,
            'status' => 'lead',
            'source_type' => $validated['source_type'] ?? Contact::SOURCE_INBOUND,
            'disposition' => Contact::DISPOSITION_NEW_LEAD,
        ]);

        $this->router->ingest($contact, $validated['source_type'] ?? Contact::SOURCE_INBOUND);

        return back()->with('status', 'Lead added to pool successfully.');
    }

    public function edit(Request $request, Contact $contact): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('contacts', 'email')->ignore($contact->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'source_type' => ['nullable', Rule::in([Contact::SOURCE_INBOUND, Contact::SOURCE_COLD])],
        ]);

        $contact->update($validated);

        return back()->with('status', 'Lead updated successfully.');
    }
}
