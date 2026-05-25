<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Notifications\MeetingBookedDeal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->id;
        $search = $request->string('search')->toString();

        return Inertia::render('crm/deals/index', [
            'deals' => Deal::query()
                ->with(['account:id,name', 'contact:id,first_name,last_name'])
                ->where('owner_id', $ownerId)
                ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function kanban(Request $request): Response
    {
        $ownerId = $request->user()->id;

        $pipelineStages = [
            Deal::STAGE_NEW,
            Deal::STAGE_MEETING_BOOKED,
            Deal::STAGE_QUALIFIED,
            Deal::STAGE_PROPOSAL,
            Deal::STAGE_WON,
        ];

        $deals = Deal::query()
            ->with(['contact:id,first_name,last_name', 'account:id,name'])
            ->where('owner_id', $ownerId)
            ->whereIn('stage', $pipelineStages)
            ->latest()
            ->get(['id', 'name', 'stage', 'value', 'probability', 'contact_id', 'account_id']);

        $columns = collect($pipelineStages)->mapWithKeys(fn ($stage) => [
            $stage => $deals->where('stage', $stage)->values(),
        ]);

        return Inertia::render('crm/deals/kanban', [
            'columns' => $columns,
            'pipelineStages' => $pipelineStages,
        ]);
    }

    public function updateStage(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless($deal->owner_id === $request->user()->id, 403);

        $data = $request->validate([
            'stage' => ['required', Rule::in([
                Deal::STAGE_NEW,
                Deal::STAGE_MEETING_BOOKED,
                Deal::STAGE_QUALIFIED,
                Deal::STAGE_PROPOSAL,
                Deal::STAGE_WON,
            ])],
        ]);

        $wasNotMeetingBooked = $deal->stage !== Deal::STAGE_MEETING_BOOKED;

        $deal->update([
            'stage' => $data['stage'],
            'meeting_booked_at' => $data['stage'] === Deal::STAGE_MEETING_BOOKED
                ? ($deal->meeting_booked_at ?? now())
                : $deal->meeting_booked_at,
        ]);

        if ($wasNotMeetingBooked && $deal->stage === Deal::STAGE_MEETING_BOOKED) {
            $request->user()->notify(new MeetingBookedDeal($deal));
        }

        return back();
    }

    public function create(Request $request): Response
    {
        return Inertia::render('crm/deals/create', $this->formOptions($request));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data, $request) {
            $deal = Deal::create([
                ...$data,
                'owner_id' => $request->user()->id,
                'meeting_booked_at' => $data['stage'] === Deal::STAGE_MEETING_BOOKED ? now() : null,
            ]);

            if ($deal->stage === Deal::STAGE_MEETING_BOOKED) {
                $request->user()->notify(new MeetingBookedDeal($deal));
            }
        });

        return to_route('deals.index')->with('status', 'Deal created.');
    }

    public function edit(Request $request, Deal $deal): Response
    {
        abort_unless($deal->owner_id === $request->user()->id, 404);

        return Inertia::render('crm/deals/edit', [
            ...$this->formOptions($request),
            'deal' => $deal->load(['account:id,name', 'contact:id,first_name,last_name']),
        ]);
    }

    public function update(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless($deal->owner_id === $request->user()->id, 404);

        $data = $this->validated($request);
        $wasMeetingBooked = $deal->stage === Deal::STAGE_MEETING_BOOKED;

        DB::transaction(function () use ($deal, $data, $request, $wasMeetingBooked) {
            $deal->update([
                ...$data,
                'meeting_booked_at' => $data['stage'] === Deal::STAGE_MEETING_BOOKED
                    ? ($deal->meeting_booked_at ?? now())
                    : $deal->meeting_booked_at,
            ]);

            if (! $wasMeetingBooked && $deal->stage === Deal::STAGE_MEETING_BOOKED) {
                $request->user()->notify(new MeetingBookedDeal($deal));
            }
        });

        return to_route('deals.index')->with('status', 'Deal updated.');
    }

    public function logMeetingOutcome(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless($deal->owner_id === $request->user()->id, 404);
        abort_unless($deal->stage === Deal::STAGE_MEETING_BOOKED, 422);

        $data = $request->validate([
            'outcome' => ['required', Rule::in(Deal::MEETING_OUTCOMES)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $nextStage = match ($data['outcome']) {
            Deal::MEETING_OUTCOME_QUALIFIED => Deal::STAGE_QUALIFIED,
            Deal::MEETING_OUTCOME_WARM_EMAIL_NURTURE => Deal::STAGE_WARM_EMAIL_NURTURE,
            Deal::MEETING_OUTCOME_DNC => Deal::STAGE_DNC,
        };

        DB::transaction(function () use ($deal, $request, $data, $nextStage) {
            $deal->update([
                'stage' => $nextStage,
                'meeting_outcome' => $data['outcome'],
                'meeting_outcome_notes' => $data['notes'] ?? null,
                'meeting_outcome_at' => now(),
                'probability' => $nextStage === Deal::STAGE_QUALIFIED ? max($deal->probability, 40) : $deal->probability,
            ]);

            Activity::create([
                'owner_id' => $request->user()->id,
                'contact_id' => $deal->contact_id,
                'deal_id' => $deal->id,
                'type' => 'meeting_outcome',
                'subject' => 'Meeting outcome: '.$this->stageLabel($nextStage),
                'body' => $data['notes'] ?? null,
                'completed_at' => now(),
            ]);
        });

        return to_route('deals.edit', $deal)->with('status', 'Meeting outcome logged.');
    }

    public function destroy(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless($deal->owner_id === $request->user()->id, 404);

        $deal->delete();

        return to_route('deals.index')->with('status', 'Deal deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'account_id' => ['nullable', Rule::exists('accounts', 'id')->where('owner_id', $request->user()->id)],
            'contact_id' => ['nullable', Rule::exists('contacts', 'id')->where('owner_id', $request->user()->id)],
            'name' => ['required', 'string', 'max:255'],
            'stage' => ['required', Rule::in(Deal::STAGES)],
            'value' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'expected_close_date' => ['nullable', 'date'],
            'probability' => ['required', 'integer', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function formOptions(Request $request): array
    {
        $ownerId = $request->user()->id;

        return [
            'accounts' => Account::where('owner_id', $ownerId)->orderBy('name')->get(['id', 'name']),
            'contacts' => Contact::where('owner_id', $ownerId)->orderBy('last_name')->get(['id', 'first_name', 'last_name']),
        ];
    }

    private function stageLabel(string $stage): string
    {
        return str($stage)->replace('_', ' ')->title()->toString();
    }
}
