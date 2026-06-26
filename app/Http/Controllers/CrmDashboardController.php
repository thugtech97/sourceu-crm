<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\CallLog;
use App\Models\Contact;
use App\Models\Deal;
use Inertia\Inertia;
use Inertia\Response;

class CrmDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $openDeals = Deal::query()
            ->whereNotIn('stage', [Deal::STAGE_WON, Deal::STAGE_LOST, Deal::STAGE_DNC]);

        return Inertia::render('crm/dashboard', [
            'stats' => [
                'accounts' => Account::count(),
                'contacts' => Contact::count(),
                'openDeals' => (clone $openDeals)->count(),
                'pipelineValue' => (clone $openDeals)->sum('value'),
                'wonValue' => Deal::where('stage', Deal::STAGE_WON)->sum('value'),
            ],
            'dealsByStage' => (clone $openDeals)
                ->selectRaw('stage, count(*) as count, sum(value) as total')
                ->groupBy('stage')
                ->get(),
            'recentContacts' => Contact::query()
                ->with('account:id,name')
                ->latest()
                ->limit(5)
                ->get(['id', 'account_id', 'first_name', 'last_name', 'email', 'phone', 'status', 'created_at']),
            'recentDeals' => Deal::query()
                ->with(['account:id,name', 'contact:id,first_name,last_name'])
                ->latest()
                ->limit(5)
                ->get(['id', 'account_id', 'contact_id', 'name', 'stage', 'value', 'expected_close_date']),
            'recentCallLogs' => CallLog::query()
                ->with('contact:id,first_name,last_name')
                ->latest('started_at')
                ->limit(6)
                ->get(['id', 'contact_id', 'direction', 'status', 'duration_seconds', 'started_at']),
        ]);
    }
}
