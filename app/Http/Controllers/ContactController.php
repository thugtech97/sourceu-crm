<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\CallLog;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->id;
        $search = $request->string('search')->toString();

        return Inertia::render('crm/contacts/index', [
            'contacts' => Contact::query()
                ->with('account:id,name')
                ->where('owner_id', $ownerId)
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('crm/contacts/create', [
            'accounts' => $this->accountOptions($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Contact::create([
            ...$this->validated($request),
            'owner_id' => $request->user()->id,
        ]);

        return to_route('contacts.index')->with('status', 'Contact created.');
    }

    public function edit(Request $request, Contact $contact): Response
    {
        abort_unless($contact->owner_id === $request->user()->id, 404);

        return Inertia::render('crm/contacts/edit', [
            'contact' => $contact->load('account:id,name'),
            'accounts' => $this->accountOptions($request),
            'callLogs' => CallLog::query()
                ->where('contact_id', $contact->id)
                ->latest('started_at')
                ->limit(20)
                ->get(['id', 'direction', 'status', 'duration_seconds', 'recording_url', 'transcript_text', 'started_at']),
        ]);
    }

    public function update(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->owner_id === $request->user()->id, 404);

        $contact->update($this->validated($request));

        return to_route('contacts.index')->with('status', 'Contact updated.');
    }

    public function destroy(Request $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->owner_id === $request->user()->id, 404);

        $contact->delete();

        return to_route('contacts.index')->with('status', 'Contact deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'account_id' => ['nullable', Rule::exists('accounts', 'id')->where('owner_id', $request->user()->id)],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['lead', 'prospect', 'customer', 'inactive'])],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function accountOptions(Request $request)
    {
        return Account::query()
            ->where('owner_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
