<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function create(Request $request): Response
    {
        return Inertia::render('crm/deals/create', $this->formOptions($request));
    }

    public function store(Request $request): RedirectResponse
    {
        Deal::create([
            ...$this->validated($request),
            'owner_id' => $request->user()->id,
        ]);

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

        $deal->update($this->validated($request));

        return to_route('deals.index')->with('status', 'Deal updated.');
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
            'stage' => ['required', Rule::in(['new', 'qualified', 'proposal', 'won', 'lost'])],
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
}
