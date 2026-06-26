<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\LeadField;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $priority = $request->string('priority')->toString();
        $assignedTo = $request->string('assigned_to')->toString();

        $leads = Lead::query()
            ->with('assignedTo:id,name')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                });
            })
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($priority, fn ($q) => $q->where('priority', $priority))
            ->when($assignedTo, fn ($q) => $q->where('assigned_to', $assignedTo))
            ->latest()
            ->paginate(20, ['id', 'first_name', 'last_name', 'email', 'phone', 'company_name', 'status', 'priority', 'icp_tier', 'icp_score', 'assigned_to', 'source_type', 'last_activity_at', 'follow_up_due_at'])
            ->withQueryString();

        return Inertia::render('crm/leads/index', [
            'leads' => $leads,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'priority' => $priority,
                'assigned_to' => $assignedTo,
            ],
            'salesReps' => $this->salesRepOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('crm/leads/create', [
            'salesReps' => $this->salesRepOptions(),
            'customFields' => LeadField::active()->get(),
        ]);
    }

    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $lead = Lead::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        $this->upsertCustomFields($lead, $request->input('custom_fields', []));

        return to_route('leads.show', $lead)->with('status', 'Lead created.');
    }

    public function show(Lead $lead): Response
    {
        $lead->load(
            'assignedTo:id,name',
            'createdBy:id,name',
            'fieldValues.field',
            'convertedContact:id,first_name,last_name,email,phone,job_title',
            'convertedAccount:id,name,industry,website',
            'convertedOpportunity:id,name,stage,value',
        );

        return Inertia::render('crm/leads/show', [
            'lead' => $lead,
            'customFields' => LeadField::active()->get(),
        ]);
    }

    public function convert(Request $request, Lead $lead): RedirectResponse
    {
        if ($lead->isConverted()) {
            return back()->with('status', 'Lead is already converted.');
        }

        DB::transaction(function () use ($lead, $request): void {
            $contactData = [
                'owner_id' => $request->user()->id,
                'first_name' => $lead->first_name,
                'last_name' => $lead->last_name,
                'phone' => $lead->phone,
                'job_title' => $lead->job_title,
                'company_name' => $lead->company_name,
                'industry' => $lead->industry,
                'source_type' => $lead->source_type,
                'status' => 'prospect',
                'disposition' => Contact::DISPOSITION_OPPORTUNITY,
                'converted_by' => $request->user()->id,
            ];

            $contact = $lead->email
                ? Contact::firstOrCreate(['email' => $lead->email], $contactData)
                : Contact::create(array_merge(['email' => null], $contactData));

            $account = null;
            if ($lead->company_name) {
                $account = Account::firstOrCreate(
                    ['name' => $lead->company_name],
                    [
                        'owner_id' => $request->user()->id,
                        'industry' => $lead->industry,
                        'website' => $lead->company_website,
                        'phone' => $lead->phone,
                    ]
                );
            }

            $deal = Deal::create([
                'owner_id' => $request->user()->id,
                'contact_id' => $contact->id,
                'account_id' => $account?->id,
                'name' => trim(($lead->company_name ?? $lead->name).' — Opportunity'),
                'stage' => Deal::STAGE_NEW,
                'value' => 0,
                'notes' => $lead->initial_notes,
            ]);

            $lead->update([
                'status' => 'converted',
                'converted_at' => now(),
                'converted_contact_id' => $contact->id,
                'converted_account_id' => $account?->id,
                'converted_opportunity_id' => $deal->id,
            ]);
        });

        return to_route('leads.show', $lead)->with('status', 'Lead converted to opportunity.');
    }

    public function disqualify(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $lead->update([
            'status' => 'disqualified',
            'disqualified_reason' => $validated['reason'] ?? null,
        ]);

        return to_route('leads.show', $lead)->with('status', 'Lead disqualified.');
    }

    public function edit(Lead $lead): Response
    {
        $lead->load('assignedTo:id,name', 'fieldValues');

        return Inertia::render('crm/leads/edit', [
            'lead' => $lead,
            'salesReps' => $this->salesRepOptions(),
            'customFields' => LeadField::active()->get(),
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): RedirectResponse
    {
        $lead->update($request->validated());

        $this->upsertCustomFields($lead, $request->input('custom_fields', []));

        return to_route('leads.show', $lead)->with('status', 'Lead updated.');
    }

    /** @param array<string, string> $values Keyed by lead_field_id */
    private function upsertCustomFields(Lead $lead, array $values): void
    {
        foreach ($values as $fieldId => $value) {
            $lead->fieldValues()->updateOrCreate(
                ['lead_field_id' => $fieldId],
                ['value' => $value !== '' ? $value : null],
            );
        }
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();

        return to_route('leads.index')->with('status', 'Lead deleted.');
    }

    /** @return array<int, array{id: int, name: string}> */
    private function salesRepOptions(): array
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->all();
    }
}
