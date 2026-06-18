<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use App\Models\DialpadWebhookLog;
use App\Models\User;
use App\Services\DialpadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DialpadTestController extends Controller
{
    public function __construct(private readonly DialpadService $dialpad) {}

    /**
     * Display the Dialpad test & debug dashboard
     */
    public function dashboard(): Response
    {
        $stats = [
            'api_key_configured' => (bool) config('services.dialpad.api_key'),
            'sandbox_mode' => config('services.dialpad.sandbox_mode', false),
            'base_url' => config('services.dialpad.base_url'),
            'users_connected' => User::whereNotNull('dialpad_user_id')->count(),
            'total_calls' => CallLog::count(),
            'recent_calls' => CallLog::latest()->limit(10)->get()->map(fn ($call) => [
                'id' => $call->id,
                'contact_name' => $call->contact?->name,
                'status' => $call->status,
                'direction' => $call->direction,
                'started_at' => $call->started_at?->format('Y-m-d H:i:s'),
                'duration_seconds' => $call->duration_seconds,
            ]),
            'webhook_logs' => DialpadWebhookLog::latest()->limit(10)->get()->map(fn ($log) => [
                'id' => $log->id,
                'event_type' => $log->event_type,
                'processed' => $log->processed,
                'error' => $log->error,
                'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
            ]),
            'connected_users' => User::whereNotNull('dialpad_user_id')->get()->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'dialpad_user_id' => $user->dialpad_user_id,
                'dialpad_number' => $user->dialpad_number,
            ]),
        ];

        return Inertia::render('dialpad/Dashboard', ['stats' => $stats]);
    }

    /**
     * Test the API connection to Dialpad
     */
    public function testConnection(): JsonResponse
    {
        try {
            if (! config('services.dialpad.api_key')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dialpad API key is not configured',
                ], 400);
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.config('services.dialpad.api_key'),
                'Accept' => 'application/json',
            ])->timeout(10)->get(config('services.dialpad.base_url').'/users?limit=1');

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Connected to Dialpad API successfully',
                    'status' => $response->status(),
                    'sandbox_mode' => config('services.dialpad.sandbox_mode'),
                    'base_url' => config('services.dialpad.base_url'),
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Dialpad API connection failed',
                    'status' => $response->status(),
                    'error' => $response->json('message') ?? $response->body(),
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Dialpad connection test failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test user lookup with detailed debug info
     */
    public function testUserLookup(Request $request): JsonResponse
    {
        $email = $request->input('email') ?? $request->query('email');

        if (! $email) {
            return response()->json([
                'success' => false,
                'message' => 'Email parameter is required',
            ], 400);
        }

        try {
            $result = $this->dialpad->testUserLookup($email);

            return response()->json([
                'success' => $result['successful'] ?? false,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('Dialpad user lookup test failed', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test webhook secret validation
     */
    public function testWebhookSecret(Request $request): JsonResponse
    {
        $payload = $request->input('payload') ?? $request->query('payload');
        $signature = $request->input('signature') ?? $request->query('signature');

        if (! $payload || ! $signature) {
            return response()->json([
                'valid' => false,
                'message' => 'Both payload and signature parameters are required',
            ], 400);
        }

        if (is_string($payload)) {
            $payload = json_decode($payload, true);
        }

        $secret = config('services.dialpad.webhook_secret');

        $computed = hash_hmac('sha256', json_encode($payload), $secret);
        $valid = hash_equals($computed, $signature);

        return response()->json([
            'valid' => $valid,
            'payload' => $payload,
            'provided_signature' => $signature,
            'computed_signature' => $computed,
            'message' => $valid ? 'Webhook signature is valid' : 'Webhook signature is invalid',
        ]);
    }

    /**
     * Simulate a webhook event for testing
     */
    public function simulateWebhookEvent(Request $request): JsonResponse
    {
        $request->validate([
            'event' => ['required', 'string', 'in:call.initiated,call.connected,call.ended,call.missed,call.recording_ready,call.transcription_ready'],
            'call_id' => ['required', 'string'],
            'user_id' => ['nullable', 'integer'],
            'phone_number' => ['nullable', 'string'],
        ]);

        try {
            // Create a test call log if it doesn't exist
            $callLog = CallLog::firstOrCreate(
                ['dialpad_call_id' => $request->input('call_id')],
                [
                    'user_id' => $request->input('user_id') ?? auth()->id(),
                    'contact_id' => null,
                    'dialpad_user_id' => auth()->user()->dialpad_user_id,
                    'direction' => 'inbound',
                    'status' => 'initiated',
                    'started_at' => now(),
                ]
            );

            // Create a webhook log to track the event
            $payload = $request->only(['event', 'call_id', 'user_id', 'phone_number']);
            $payload['test'] = true;

            $webhookLog = DialpadWebhookLog::create([
                'dialpad_call_id' => $request->input('call_id'),
                'event_type' => $request->input('event'),
                'payload' => $payload,
                'processed' => true,
            ]);

            Log::info('Dialpad webhook simulation', [
                'event' => $request->input('event'),
                'call_id' => $request->input('call_id'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Webhook event simulated successfully',
                'call_log_id' => $callLog->id,
                'webhook_log_id' => $webhookLog->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Dialpad webhook simulation failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get detailed integration status
     */
    public function status(): JsonResponse
    {
        $currentUser = auth()->user();

        return response()->json([
            'integration_status' => 'active',
            'environment' => config('app.env'),
            'sandbox_mode' => config('services.dialpad.sandbox_mode'),
            'api_base_url' => config('services.dialpad.base_url'),
            'api_configured' => (bool) config('services.dialpad.api_key'),
            'webhook_secret_configured' => (bool) config('services.dialpad.webhook_secret'),
            'current_user' => [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
                'dialpad_connected' => $currentUser->dialpad_connected,
                'dialpad_user_id' => $currentUser->dialpad_user_id,
                'dialpad_number' => $currentUser->dialpad_number,
            ],
            'statistics' => [
                'total_users_connected' => User::whereNotNull('dialpad_user_id')->count(),
                'total_calls' => CallLog::count(),
                'successful_calls' => CallLog::where('status', 'completed')->count(),
                'webhook_logs_processed' => DialpadWebhookLog::where('processed', true)->count(),
                'webhook_logs_failed' => DialpadWebhookLog::where('processed', false)->count(),
            ],
        ]);
    }

    /**
     * Get recent call logs with full details
     */
    public function getCallLogs(Request $request): JsonResponse
    {
        $limit = min($request->input('limit', 20), 100);

        $logs = CallLog::with(['contact', 'user'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'dialpad_call_id' => $log->dialpad_call_id,
                'contact' => [
                    'id' => $log->contact?->id,
                    'name' => $log->contact?->name,
                    'phone' => $log->contact?->phone,
                    'email' => $log->contact?->email,
                ],
                'user' => [
                    'id' => $log->user?->id,
                    'name' => $log->user?->name,
                    'email' => $log->user?->email,
                ],
                'direction' => $log->direction,
                'status' => $log->status,
                'duration_seconds' => $log->duration_seconds,
                'recording_url' => $log->recording_url,
                'transcript_text' => $log->transcript_text ? substr($log->transcript_text, 0, 200).'...' : null,
                'started_at' => $log->started_at?->format('Y-m-d H:i:s'),
                'connected_at' => $log->connected_at?->format('Y-m-d H:i:s'),
                'ended_at' => $log->ended_at?->format('Y-m-d H:i:s'),
            ]);

        return response()->json([
            'success' => true,
            'data' => $logs,
            'total' => CallLog::count(),
        ]);
    }

    /**
     * Get recent webhook logs
     */
    public function getWebhookLogs(Request $request): JsonResponse
    {
        $limit = min($request->input('limit', 20), 100);

        $logs = DialpadWebhookLog::latest()
            ->limit($limit)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'dialpad_call_id' => $log->dialpad_call_id,
                'event_type' => $log->event_type,
                'processed' => $log->processed,
                'error' => $log->error,
                'payload_keys' => array_keys($log->payload ?? []),
                'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
            ]);

        return response()->json([
            'success' => true,
            'data' => $logs,
            'total' => DialpadWebhookLog::count(),
        ]);
    }

    /**
     * Clear test data
     */
    public function clearTestData(): JsonResponse
    {
        try {
            // Only delete test records (those with test flag in webhook logs)
            $deleted = DialpadWebhookLog::where('payload->test', true)->delete();

            Log::info('Dialpad test data cleared', ['records_deleted' => $deleted]);

            return response()->json([
                'success' => true,
                'message' => "Cleared $deleted test records",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export call logs as CSV
     */
    public function exportCallLogs(): JsonResponse
    {
        try {
            $logs = CallLog::with(['contact', 'user'])
                ->get()
                ->map(fn ($log) => [
                    'Call ID' => $log->dialpad_call_id,
                    'Contact' => $log->contact?->name,
                    'Phone' => $log->contact?->phone,
                    'User' => $log->user?->name,
                    'Direction' => $log->direction,
                    'Status' => $log->status,
                    'Duration (sec)' => $log->duration_seconds,
                    'Started' => $log->started_at?->format('Y-m-d H:i:s'),
                    'Connected' => $log->connected_at?->format('Y-m-d H:i:s'),
                    'Ended' => $log->ended_at?->format('Y-m-d H:i:s'),
                ]);

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Manually fetch and update transcripts for a call
     */
    public function fetchCallTranscript(Request $request): JsonResponse
    {
        $request->validate([
            'call_id' => ['required', 'string'],
        ]);

        try {
            $callId = $request->input('call_id');
            $callLog = CallLog::where('dialpad_call_id', $callId)->first();

            if (! $callLog) {
                return response()->json([
                    'success' => false,
                    'message' => 'Call log not found',
                ], 404);
            }

            // Fetch transcript from Dialpad API
            $transcript = $this->dialpad->getTranscript($callId);
            $recordingUrl = $this->dialpad->getRecordingUrl($callId);

            if ($transcript) {
                $callLog->update(['transcript_text' => $transcript]);
            }

            if ($recordingUrl) {
                $callLog->update(['recording_url' => $recordingUrl]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transcript and recording fetched successfully',
                'call_log' => [
                    'id' => $callLog->id,
                    'dialpad_call_id' => $callLog->dialpad_call_id,
                    'status' => $callLog->status,
                    'has_transcript' => (bool) $callLog->transcript_text,
                    'has_recording' => (bool) $callLog->recording_url,
                    'transcript_text' => $callLog->transcript_text ? substr($callLog->transcript_text, 0, 200).'...' : null,
                    'recording_url' => $callLog->recording_url,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch transcript', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all calls without transcripts
     */
    public function getCallsWithoutTranscripts(): JsonResponse
    {
        try {
            $calls = CallLog::where('status', 'ended')
                ->whereNull('transcript_text')
                ->with(['contact', 'user'])
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn ($call) => [
                    'id' => $call->id,
                    'dialpad_call_id' => $call->dialpad_call_id,
                    'contact_name' => $call->contact?->name,
                    'user_name' => $call->user?->name,
                    'status' => $call->status,
                    'direction' => $call->direction,
                    'duration_seconds' => $call->duration_seconds,
                    'ended_at' => $call->ended_at?->format('Y-m-d H:i:s'),
                ]);

            return response()->json([
                'success' => true,
                'data' => $calls,
                'total' => CallLog::where('status', 'ended')->whereNull('transcript_text')->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
