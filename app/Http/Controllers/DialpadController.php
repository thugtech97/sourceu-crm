<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Contact;
use App\Services\DialpadService;
use Illuminate\Http\JsonResponse;
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

    public function getCallTranscripts(Request $request, Contact $contact): JsonResponse
    {
        $limit = min($request->input('limit', 10), 50);

        $calls = $contact->callLogs()
            ->whereNotNull('transcript_text')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($call) => [
                'id' => $call->id,
                'dialpad_call_id' => $call->dialpad_call_id,
                'status' => $call->status,
                'direction' => $call->direction,
                'duration_seconds' => $call->duration_seconds,
                'transcript_text' => $call->transcript_text,
                'recording_url' => $call->recording_url,
                'started_at' => $call->started_at?->format('Y-m-d H:i:s'),
                'ended_at' => $call->ended_at?->format('Y-m-d H:i:s'),
                'user_name' => $call->user?->name,
            ]);

        return response()->json([
            'success' => true,
            'data' => $calls,
            'contact' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'phone' => $contact->phone,
            ],
        ]);
    }
}
