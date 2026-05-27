<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use OwenIt\Auditing\Models\Audit;

class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $event = $request->string('event')->toString();
        $model = $request->string('model')->toString();

        $audits = Audit::query()
            ->with('user:id,name,email')
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('auditable_type', 'like', "%{$search}%")
                    ->orWhere('old_values', 'like', "%{$search}%")
                    ->orWhere('new_values', 'like', "%{$search}%");
            }))
            ->when($event, fn ($q) => $q->where('event', $event))
            ->when($model, fn ($q) => $q->where('auditable_type', 'like', "%{$model}%"))
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($audit) => [
                'id' => $audit->id,
                'user' => $audit->user ? ['name' => $audit->user->name, 'email' => $audit->user->email] : null,
                'event' => $audit->event,
                'auditable_type' => class_basename($audit->auditable_type),
                'auditable_id' => $audit->auditable_id,
                'old_values' => $audit->old_values,
                'new_values' => $audit->new_values,
                'ip_address' => $audit->ip_address,
                'created_at' => $audit->created_at->toISOString(),
            ]);

        return Inertia::render('admin/audit-log', [
            'audits' => $audits,
            'filters' => [
                'search' => $search,
                'event' => $event,
                'model' => $model,
            ],
        ]);
    }
}
