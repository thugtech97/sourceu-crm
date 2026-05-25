<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Services\LeadRoutingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecycleExpiredLeadsJob implements ShouldQueue
{
    use Queueable;

    public function handle(LeadRoutingService $router): void
    {
        Contact::query()
            ->whereNotNull('pool_assigned_to')
            ->where('pool_expires_at', '<', now())
            ->whereIn('disposition', [Contact::DISPOSITION_NEW_LEAD, Contact::DISPOSITION_RECYCLED])
            ->with('poolAssignedTo')
            ->chunkById(100, function ($contacts) use ($router) {
                foreach ($contacts as $contact) {
                    $router->recycle($contact);
                }
            });
    }
}
