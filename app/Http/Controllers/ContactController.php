<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\CallLog;
use App\Models\Contact;
use App\Services\LeadRoutingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        return Inertia::render('crm/contacts/index', [
            'contacts' => Contact::query()
                ->with('account:id,name')
                ->where('disposition', Contact::DISPOSITION_OPPORTUNITY)
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->latest()
                ->paginate(10, ['id', 'account_id', 'first_name', 'last_name', 'email', 'phone', 'job_title', 'status', 'source_type'])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('crm/contacts/create', [
            'accounts' => $this->accountOptions(),
        ]);
    }

    public function store(Request $request, LeadRoutingService $router): RedirectResponse
    {
        $data = $this->validated($request);

        // Check for duplicate email if email is provided
        if (! empty($data['email'])) {
            $existingContact = Contact::where('email', $data['email'])->first();
            if ($existingContact) {
                return back()->withErrors(['email' => 'The email has already been taken.'])->withInput();
            }
        }

        $contact = Contact::create([
            ...$data,
            'owner_id' => $request->user()->id,
            'disposition' => Contact::DISPOSITION_OPPORTUNITY,
        ]);

        if ($data['status'] === 'lead') {
            $router->ingest($contact, $data['source_type'] ?? Contact::SOURCE_INBOUND);
        }

        return to_route('contacts.index')->with('status', 'Contact created.');
    }

    public function edit(Request $request, Contact $contact): Response
    {
        return Inertia::render('crm/contacts/edit', [
            'contact' => $contact->load('account:id,name'),
            'accounts' => $this->accountOptions(),
            'callLogs' => CallLog::query()
                ->where('contact_id', $contact->id)
                ->latest('started_at')
                ->limit(20)
                ->get(['id', 'direction', 'status', 'duration_seconds', 'recording_url', 'transcript_text', 'started_at']),
        ]);
    }

    public function update(Request $request, Contact $contact): RedirectResponse
    {
        $contact->update($this->validated($request));

        return to_route('contacts.index')->with('status', 'Contact updated.');
    }

    public function destroy(Request $request, Contact $contact): RedirectResponse
    {
        $contact->delete();

        return to_route('contacts.index')->with('status', 'Contact deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'account_id' => ['nullable', Rule::exists('accounts', 'id')],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['lead', 'prospect', 'customer', 'inactive'])],
            'source_type' => ['nullable', Rule::in([Contact::SOURCE_INBOUND, Contact::SOURCE_COLD])],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function accountOptions(): array
    {
        return Account::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->all();
    }
}
