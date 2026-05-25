<?php

namespace App\Http\Controllers;

use App\Models\DncList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DncListController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $entries = DncList::query()
            ->with(['addedBy:id,name', 'contact:id,first_name,last_name'])
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('crm/dnc/index', [
            'entries' => $entries,
            'filters' => ['search' => $search],
            'total' => DncList::count(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($data['phone']) && empty($data['email'])) {
            return back()->withErrors(['phone' => 'Provide at least a phone number or email address.']);
        }

        DncList::firstOrCreate(
            array_filter(['phone' => $data['phone'] ?? null, 'email' => $data['email'] ?? null]),
            ['reason' => $data['reason'] ?? null, 'added_by' => $request->user()->id],
        );

        return back()->with('status', 'Entry added to DNC list.');
    }

    public function destroy(DncList $dnc): RedirectResponse
    {
        $dnc->delete();

        return back()->with('status', 'Entry removed from DNC list.');
    }
}
