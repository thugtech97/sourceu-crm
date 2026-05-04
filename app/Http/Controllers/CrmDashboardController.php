<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrmDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $ownerId = $request->user()->id;

        $openDeals = Deal::query()
            ->where('owner_id', $ownerId)
            ->whereNotIn('stage', ['won', 'lost']);

        return Inertia::render('crm/dashboard', [
            'stats' => [
                'accounts' => Account::where('owner_id', $ownerId)->count(),
                'contacts' => Contact::where('owner_id', $ownerId)->count(),
                'openDeals' => (clone $openDeals)->count(),
                'pipelineValue' => (clone $openDeals)->sum('value'),
                'wonValue' => Deal::where('owner_id', $ownerId)->where('stage', 'won')->sum('value'),
            ],
            'recentContacts' => Contact::query()
                ->with('account:id,name')
                ->where('owner_id', $ownerId)
                ->latest()
                ->limit(5)
                ->get(['id', 'account_id', 'first_name', 'last_name', 'email', 'phone', 'status', 'created_at']),
            'recentDeals' => Deal::query()
                ->with(['account:id,name', 'contact:id,first_name,last_name'])
                ->where('owner_id', $ownerId)
                ->latest()
                ->limit(5)
                ->get(['id', 'account_id', 'contact_id', 'name', 'stage', 'value', 'expected_close_date']),
        ]);
    }
}
