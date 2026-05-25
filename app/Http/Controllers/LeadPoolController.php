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
            ->whereIn('disposition', [Contact::DISPOSITION_NEW_LEAD, Contact::DISPOSITION_RECYCLED])
            ->latest();

        $myLeadsQuery = Contact::query()
            ->with('account:id,name')
            ->where('pool_team', $team)
            ->where('pool_assigned_to', $userId)
            ->whereIn('disposition', [Contact::DISPOSITION_NEW_LEAD, Contact::DISPOSITION_RECYCLED])
            ->latest('pool_assigned_at');

        return Inertia::render('crm/leads/pool', [
            'pool' => $poolQuery->paginate(20, pageName: 'pool_page')->withQueryString(),
            'myLeads' => $myLeadsQuery->paginate(20, pageName: 'my_page')->withQueryString(),
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

    public function setDisposition(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->pool_assigned_to === $request->user()->id, 403);

        $data = $request->validate([
            'disposition' => ['required', Rule::in([
                Contact::DISPOSITION_OPPORTUNITY,
                Contact::DISPOSITION_WARM_EMAIL,
                Contact::DISPOSITION_DNC,
                Contact::DISPOSITION_HANDOFF_TO_SALES,
                Contact::DISPOSITION_MEETING_BOOKED,
            ])],
            'reason' => ['nullable', 'string', 'max:500'],
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

        match ($data['disposition']) {
            Contact::DISPOSITION_DNC => $this->router->markDnc($contact, $user, $data['reason'] ?? null),
            Contact::DISPOSITION_HANDOFF_TO_SALES => $this->router->handoffToSales($contact, $user),
            Contact::DISPOSITION_WARM_EMAIL => $this->router->enrollInWarmEmail($contact),
            Contact::DISPOSITION_MEETING_BOOKED => $this->router->bookMeeting($contact, $user),
        };

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
}
