<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\UserApprovedNotification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserApprovalController extends Controller
{
    public function index(): Response
    {
        $pendingUsers = User::pendingApproval()
            ->latest()
            ->get(['id', 'name', 'email', 'created_at', 'email_verified_at']);

        $allUsers = User::whereNotNull('email_verified_at')
            ->where('is_approved', true)
            ->latest()
            ->get(['id', 'name', 'email', 'is_admin', 'created_at']);

        return Inertia::render('admin/users', [
            'pendingUsers' => $pendingUsers,
            'allUsers' => $allUsers,
        ]);
    }

    public function approve(User $user): RedirectResponse
    {
        $user->update(['is_approved' => true]);
        $user->notify(new UserApprovedNotification);

        return back()->with('status', "{$user->name} has been approved.");
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return back()->with('status', 'User removed.');
    }
}
