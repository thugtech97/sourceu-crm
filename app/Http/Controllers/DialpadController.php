<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Contact;
use App\Services\DialpadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DialpadController extends Controller
{
    public function __construct(private readonly DialpadService $dialpad) {}

    public function connect(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            $dialpadUser = $this->dialpad->findUserByEmail($data['email']);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['dialpad' => $e->getMessage()]);
        }

        if (! $dialpadUser) {
            return back()->withErrors(['email' => 'No Dialpad user found for that email.']);
        }

        try {
            $this->dialpad->assignConfiguredAccessControlPolicy($dialpadUser);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['dialpad' => $e->getMessage()]);
        }

        $request->user()->update([
            'dialpad_user_id' => $dialpadUser['id'],
            'dialpad_number' => $dialpadUser['phone_number'] ?? null,
            'dialpad_connected' => true,
        ]);

        return back()->with('status', 'Dialpad account connected.');
    }

    public function testLookup(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            $result = $this->dialpad->testUserLookup($data['email']);
        } catch (\RuntimeException $e) {
            $result = [
                'email' => $data['email'],
                'successful' => false,
                'message' => $e->getMessage(),
            ];
        }

        return back()->with('dialpad_test', $result);
    }

    public function dial(Request $request, Contact $contact): RedirectResponse
    {
        try {
            $callLog = $this->dialpad->initiateCall($contact, $request->user());
        } catch (\RuntimeException $e) {
            return back()->withErrors(['dialpad' => $e->getMessage()]);
        }

        Activity::create([
            'owner_id' => $request->user()->id,
            'contact_id' => $contact->id,
            'type' => 'call',
            'subject' => 'Dialpad call started',
            'body' => 'Dialpad call ID: '.$callLog->dialpad_call_id,
            'completed_at' => now(),
        ]);

        return back()->with('status', 'Dialpad call started. Your softphone should ring shortly.');
    }
}
