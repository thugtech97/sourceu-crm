<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\BusinessType;
use App\Models\BusinessUnit;
use App\Models\Contact;
use App\Models\Industry;
use App\Models\LeadSource;
use App\Models\Role;
use App\Services\LeadRoutingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LeadPoolController extends Controller
{
    public function __construct(private readonly LeadRoutingService $router) {}

    public function index(Request $request): Response
    {
        $team = $request->string('team', Contact::TEAM_SALES)->toString();
        $userId = $request->user()->id;
        $perPage = (int) $request->query('per_page', 20);
        // Limit per_page to prevent abuse
        $perPage = min($perPage, 100);
        $perPage = max($perPage, 10);

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
            'pool' => $poolQuery->paginate($perPage, pageName: 'pool_page')->withQueryString(),
            'myLeads' => $myLeadsQuery->paginate($perPage, pageName: 'my_page')->withQueryString(),
            'archived' => $archivedQuery->paginate($perPage, pageName: 'archive_page')->withQueryString(),
            'team' => $team,
            'teams' => [
                ['value' => Contact::TEAM_SALES, 'label' => 'Inbound Sales'],
                ['value' => Contact::TEAM_COLD_CALLING, 'label' => 'Cold Calling'],
            ],
            'accounts' => Account::query()
                ->where('owner_id', $userId)
                ->orderBy('name')
                ->get(['id', 'name']),
            'businessUnits' => BusinessUnit::query()
                ->orderBy('name')
                ->get(['id', 'name']),
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
        ]);

        // Ensure contact has company_name before converting to opportunity
        if ($data['disposition'] === Contact::DISPOSITION_OPPORTUNITY && ! $contact->company_name) {
            throw ValidationException::withMessages([
                'company_name' => 'Contact must have a company name to convert to opportunity. Please add company information to the lead first.',
            ]);
        }

        $user = $request->user();

        if ($data['disposition'] === Contact::DISPOSITION_OPPORTUNITY) {
            // Return a flag so the frontend knows to open the conversion wizard
            // The actual conversion happens via POST /leads/pool/{contact}/convert
            return to_route('leads.pool.index')->with('open_convert_wizard', $contact->id);
        }

        if ($data['disposition'] === 'archive') {
            $contact->update([
                'archived_at'      => now(),
                'archive_reason'   => $data['archive_reason'],
                'archived_by'      => $user->id,
                'pool_assigned_to' => null,
                'pool_assigned_at' => null,
                'pool_expires_at'  => null,
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

    /**
     * Return the pre-filled data for the conversion wizard.
     */
    public function conversionData(Request $request, Contact $contact): \Illuminate\Http\JsonResponse
    {
        abort_unless($contact->pool_assigned_to === $request->user()->id, 403);

        $contact->load(['account:id,name,business_type,industry,website,phone,notes']);

        return response()->json([
            'contact' => [
                'id'          => $contact->id,
                'salutation'  => $contact->salutation,
                'first_name'  => $contact->first_name,
                'middle_name' => $contact->middle_name,
                'last_name'   => $contact->last_name,
                'suffix'      => $contact->suffix,
                'lead_owner'  => $contact->lead_owner,
            ],
            'account' => $contact->account ? [
                'id'            => $contact->account->id,
                'name'          => $contact->account->name,
                'business_type' => $contact->account->business_type,
            ] : [
                'id'            => null,
                'name'          => $contact->company_name,
                'business_type' => null,
            ],
        ]);
    }

    /**
     * Full wizard conversion: create Account + update Contact + create Opportunity.
     */
    public function convertFromWizard(Request $request, Contact $contact): \Illuminate\Http\RedirectResponse
    {
        abort_unless($contact->pool_assigned_to === $request->user()->id, 403);

        $validated = $request->validate([
            // Account
            'account_name'          => ['required', 'string', 'max:255'],
            'account_business_type' => ['nullable', 'string', 'in:Business,Client/Participant'],
            // Contact
            'salutation'            => ['nullable', 'string', 'max:10'],
            'first_name'            => ['required', 'string', 'max:255'],
            'middle_name'           => ['nullable', 'string', 'max:255'],
            'last_name'             => ['required', 'string', 'max:255'],
            'suffix'                => ['nullable', 'string', 'max:50'],
            // Opportunity
            'opportunity_name'      => ['required', 'string', 'max:255'],
            'record_type'           => ['nullable', 'string', 'max:255'],
        ]);

        $deal = $this->router->convertToOpportunity($contact, $request->user(), $validated);

        return to_route('deals.edit', $deal)->with('status', 'Lead successfully converted to opportunity!');
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
            // Account (can be either account_id or new account name)
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'account_name' => ['nullable', 'string', 'max:255'],
            // Lead Information
            'first_name' => ['required', 'string', 'max:255'],
            'salutation' => ['nullable', 'string', 'max:10'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'title' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'role_name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'industry_name' => ['nullable', 'string', 'max:255'],
            'business_type_id' => ['nullable', 'integer', 'exists:business_types,id'],
            'business_type_name' => ['nullable', 'string', 'max:255'],
            'lead_source_id' => ['nullable', 'integer', 'exists:lead_sources,id'],
            'lead_source_name' => ['nullable', 'string', 'max:255'],
            'employee_size' => ['nullable', 'string', 'max:255'],
            'linkedin' => ['nullable', 'string', 'max:500'],
            'position_applied' => ['nullable', 'string', 'max:255'],
            'last_company' => ['nullable', 'string', 'max:255'],
            'gender_identity' => ['nullable', 'string', 'max:50'],
            'lead_source' => ['nullable', 'string', 'max:255'],
            'lead_owner' => ['nullable', 'string', 'max:255'],
            'business_unit' => ['nullable', 'string', 'max:255'],
            'services' => ['nullable', 'string', 'max:1000'],
            'service_description' => ['nullable', 'string', 'max:1000'],
            // Contact Information
            'email' => ['nullable', 'email', 'max:255', 'unique:contacts,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'other_phone' => ['nullable', 'string', 'max:20'],
            // Address Information
            'street' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:255'],
            'state_province' => ['nullable', 'string', 'max:255'],
            'zip_postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:255'],
            // Lead Status & Score
            'lead_status' => ['required', 'string', 'max:255'],
            'reason_not_qualified' => ['nullable', 'string', 'max:500'],
            'estimated_value' => ['nullable', 'numeric', 'min:0'],
            // NDIS/Service-related
            'ndis_funding' => ['nullable', 'string', 'max:255'],
            'client_with_complex_needs' => ['nullable', 'boolean'],
            'sm_field_ndis_funding' => ['nullable', 'string', 'max:255'],
            'ndis_accommodation' => ['nullable', 'string', 'max:1000'],
            'region_territory' => ['nullable', 'string', 'max:255'],
            'are_you_in_the_area' => ['nullable', 'boolean'],
            'are_you_in_merrylands' => ['nullable', 'boolean'],
            'are_you_in_pacific_pines' => ['nullable', 'boolean'],
            // Other
            'notes' => ['nullable', 'string', 'max:1000'],
            'source_type' => ['nullable', Rule::in([Contact::SOURCE_INBOUND, Contact::SOURCE_COLD])],
        ]);

        // Validate that either account_id or account_name is provided
        if (! ($validated['account_id'] ?? false) && ! ($validated['account_name'] ?? false)) {
            throw ValidationException::withMessages([
                'account_id' => 'Please select or create an account.',
            ]);
        }

        $accountId = $validated['account_id'] ?? null;

        // If account_name provided, create new account
        if (! $accountId && ($validated['account_name'] ?? false)) {
            $newAccount = Account::create([
                'owner_id' => $request->user()->id,
                'name' => $validated['account_name'],
            ]);
            $accountId = $newAccount->id;
        }

        // Use account name from account_id or provided account_name
        $companyName = $validated['account_name'] ?? null;
        if ($accountId && ! $companyName) {
            $account = Account::find($accountId);
            $companyName = $account?->name;
        }

        // Handle role
        $roleId = $validated['role_id'] ?? null;
        if (! $roleId && ($validated['role_name'] ?? false)) {
            $role = Role::firstOrCreate(
                ['name' => $validated['role_name'], 'owner_id' => $request->user()->id],
            );
            $roleId = $role->id;
        }

        // Handle industry
        $industryId = $validated['industry_id'] ?? null;
        if (! $industryId && ($validated['industry_name'] ?? false)) {
            $industry = Industry::firstOrCreate(
                ['name' => $validated['industry_name'], 'owner_id' => $request->user()->id],
            );
            $industryId = $industry->id;
        }

        // Handle business type
        $businessTypeId = $validated['business_type_id'] ?? null;
        if (! $businessTypeId && ($validated['business_type_name'] ?? false)) {
            $businessType = BusinessType::firstOrCreate(
                ['name' => $validated['business_type_name'], 'owner_id' => $request->user()->id],
            );
            $businessTypeId = $businessType->id;
        }

        // Handle lead source
        $leadSourceId = $validated['lead_source_id'] ?? null;
        if (! $leadSourceId && ($validated['lead_source_name'] ?? false)) {
            $leadSource = LeadSource::firstOrCreate(
                ['name' => $validated['lead_source_name'], 'owner_id' => $request->user()->id],
            );
            $leadSourceId = $leadSource->id;
        }

        $contact = Contact::create([
            ...$validated,
            'account_id' => $accountId,
            'company_name' => $companyName,
            'role_id' => $roleId,
            'industry_id' => $industryId,
            'business_type_id' => $businessTypeId,
            'lead_source_id' => $leadSourceId,
            'owner_id' => $request->user()->id,
            'pool_team' => $team,
            'status' => 'lead',
            'source_type' => $validated['source_type'] ?? Contact::SOURCE_INBOUND,
            'disposition' => Contact::DISPOSITION_NEW_LEAD,
        ]);

        $this->router->ingest($contact, $validated['source_type'] ?? Contact::SOURCE_INBOUND);

        return back()->with('status', 'Lead added to pool successfully.');
    }

    public function edit(Request $request, Contact $contact): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            // Account (can be either account_id or new account name)
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'account_name' => ['nullable', 'string', 'max:255'],
            // Lead Information
            'first_name' => ['required', 'string', 'max:255'],
            'salutation' => ['nullable', 'string', 'max:10'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'title' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'role_name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'industry_name' => ['nullable', 'string', 'max:255'],
            'business_type_id' => ['nullable', 'integer', 'exists:business_types,id'],
            'business_type_name' => ['nullable', 'string', 'max:255'],
            'lead_source_id' => ['nullable', 'integer', 'exists:lead_sources,id'],
            'lead_source_name' => ['nullable', 'string', 'max:255'],
            'employee_size' => ['nullable', 'string', 'max:255'],
            'linkedin' => ['nullable', 'string', 'max:500'],
            'position_applied' => ['nullable', 'string', 'max:255'],
            'last_company' => ['nullable', 'string', 'max:255'],
            'gender_identity' => ['nullable', 'string', 'max:50'],
            'lead_source' => ['nullable', 'string', 'max:255'],
            'lead_owner' => ['nullable', 'string', 'max:255'],
            'business_unit' => ['nullable', 'string', 'max:255'],
            'services' => ['nullable', 'string', 'max:1000'],
            'service_description' => ['nullable', 'string', 'max:1000'],
            // Contact Information
            'email' => ['nullable', 'email', 'max:255', Rule::unique('contacts', 'email')->ignore($contact->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'other_phone' => ['nullable', 'string', 'max:20'],
            // Address Information
            'street' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:255'],
            'state_province' => ['nullable', 'string', 'max:255'],
            'zip_postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:255'],
            // Lead Status & Score
            'lead_status' => ['required', 'string', 'max:255'],
            'reason_not_qualified' => ['nullable', 'string', 'max:500'],
            'estimated_value' => ['nullable', 'numeric', 'min:0'],
            // NDIS/Service-related
            'ndis_funding' => ['nullable', 'string', 'max:255'],
            'client_with_complex_needs' => ['nullable', 'boolean'],
            'sm_field_ndis_funding' => ['nullable', 'string', 'max:255'],
            'ndis_accommodation' => ['nullable', 'string', 'max:1000'],
            'region_territory' => ['nullable', 'string', 'max:255'],
            'are_you_in_the_area' => ['nullable', 'boolean'],
            'are_you_in_merrylands' => ['nullable', 'boolean'],
            'are_you_in_pacific_pines' => ['nullable', 'boolean'],
            // Other
            'notes' => ['nullable', 'string', 'max:1000'],
            'source_type' => ['nullable', Rule::in([Contact::SOURCE_INBOUND, Contact::SOURCE_COLD])],
        ]);

        // Validate that either account_id or account_name is provided
        if (! ($validated['account_id'] ?? false) && ! ($validated['account_name'] ?? false)) {
            throw ValidationException::withMessages([
                'account_id' => 'Please select or create an account.',
            ]);
        }

        $accountId = $validated['account_id'] ?? null;

        // If account_name provided, create new account
        if (! $accountId && ($validated['account_name'] ?? false)) {
            $newAccount = Account::create([
                'owner_id' => $request->user()->id,
                'name' => $validated['account_name'],
            ]);
            $accountId = $newAccount->id;
        }

        // Use account name from account_id or provided account_name
        $companyName = $validated['account_name'] ?? null;
        if ($accountId && ! $companyName) {
            $account = Account::find($accountId);
            $companyName = $account?->name;
        }

        // Handle role
        $roleId = $validated['role_id'] ?? null;
        if (! $roleId && ($validated['role_name'] ?? false)) {
            $role = Role::firstOrCreate(
                ['name' => $validated['role_name'], 'owner_id' => $request->user()->id],
            );
            $roleId = $role->id;
        }

        // Handle industry
        $industryId = $validated['industry_id'] ?? null;
        if (! $industryId && ($validated['industry_name'] ?? false)) {
            $industry = Industry::firstOrCreate(
                ['name' => $validated['industry_name'], 'owner_id' => $request->user()->id],
            );
            $industryId = $industry->id;
        }

        // Handle business type
        $businessTypeId = $validated['business_type_id'] ?? null;
        if (! $businessTypeId && ($validated['business_type_name'] ?? false)) {
            $businessType = BusinessType::firstOrCreate(
                ['name' => $validated['business_type_name'], 'owner_id' => $request->user()->id],
            );
            $businessTypeId = $businessType->id;
        }

        // Handle lead source
        $leadSourceId = $validated['lead_source_id'] ?? null;
        if (! $leadSourceId && ($validated['lead_source_name'] ?? false)) {
            $leadSource = LeadSource::firstOrCreate(
                ['name' => $validated['lead_source_name'], 'owner_id' => $request->user()->id],
            );
            $leadSourceId = $leadSource->id;
        }

        $contact->update([
            ...$validated,
            'account_id' => $accountId,
            'company_name' => $companyName,
            'role_id' => $roleId,
            'industry_id' => $industryId,
            'business_type_id' => $businessTypeId,
            'lead_source_id' => $leadSourceId,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Lead updated successfully.']);
        }

        return back()->with('status', 'Lead updated successfully.');
    }
}
