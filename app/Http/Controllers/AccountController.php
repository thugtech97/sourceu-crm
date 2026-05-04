<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->id;
        $search = $request->string('search')->toString();

        return Inertia::render('crm/accounts/index', [
            'accounts' => Account::query()
                ->withCount(['contacts', 'deals'])
                ->where('owner_id', $ownerId)
                ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('crm/accounts/create');
    }

    public function store(Request $request): RedirectResponse
    {
        Account::create([
            ...$this->validated($request),
            'owner_id' => $request->user()->id,
        ]);

        return to_route('accounts.index')->with('status', 'Account created.');
    }

    public function edit(Request $request, Account $account): Response
    {
        abort_unless($account->owner_id === $request->user()->id, 404);

        return Inertia::render('crm/accounts/edit', [
            'account' => $account,
        ]);
    }

    public function update(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->owner_id === $request->user()->id, 404);

        $account->update($this->validated($request));

        return to_route('accounts.index')->with('status', 'Account updated.');
    }

    public function destroy(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->owner_id === $request->user()->id, 404);

        $account->delete();

        return to_route('accounts.index')->with('status', 'Account deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
