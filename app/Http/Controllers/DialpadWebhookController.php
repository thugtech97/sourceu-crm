<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use App\Models\DialpadWebhookLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DialpadWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (!$this->signatureIsValid($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->json()->all();
        $eventType = $payload['event'] ?? 'unknown';
        $callId = $payload['call_id'] ?? $payload['id'] ?? null;

        $log = DialpadWebhookLog::firstOrCreate(
            ['dialpad_call_id' => $callId, 'event_type' => $eventType],
            ['payload' => $payload]
        );

        if ($log->wasRecentlyCreated === false && $log->processed) {
            return response()->json(['message' => 'Duplicate skipped']);
        }

        try {
            $this->applyCallEvent($eventType, $payload, $callId);
            $log->update(['processed' => true, 'error' => null]);
        } catch (\Throwable $e) {
            $log->update(['processed' => false, 'error' => $e->getMessage()]);
            Log::error('Dialpad webhook failed', ['event' => $eventType, 'call_id' => $callId, 'error' => $e->getMessage()]);
        }

        return response()->json(['message' => 'OK']);
    }

    private function applyCallEvent(string $eventType, array $payload, ?string $callId): void
    {
        if (!$callId) {
            return;
        }

        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (!$callLog) {
            return;
        }

        match ($eventType) {
            'call.connected' => $callLog->update(['status' => 'connected', 'connected_at' => now(), 'dialpad_payload' => array_merge($callLog->dialpad_payload ?? [], $payload)]),
            'call.ended' => $callLog->update([
                'status' => 'ended',
                'ended_at' => now(),
                'duration_seconds' => $payload['duration'] ?? $payload['duration_seconds'] ?? null,
                'dialpad_payload' => array_merge($callLog->dialpad_payload ?? [], $payload),
            ]),
            'call.missed' => $callLog->update(['status' => 'missed', 'ended_at' => now(), 'dialpad_payload' => array_merge($callLog->dialpad_payload ?? [], $payload)]),
            'call.recording_ready' => $callLog->update(['recording_url' => $payload['recording_url'] ?? $payload['url'] ?? null]),
            'call.transcription_ready' => $callLog->update([
                'transcript_url' => $payload['transcript_url'] ?? null,
                'transcript_text' => $payload['transcript'] ?? $payload['text'] ?? null,
            ]),
            default => null,
        };
    }

    private function signatureIsValid(Request $request): bool
    {
        $secret = config('services.dialpad.webhook_secret');

        if (!$secret) {
            return app()->environment('local');
        }

        $signature = $request->header('X-Dialpad-Signature') ?? $request->header('Dialpad-Signature');

        if (!$signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, ltrim($signature, 'sha256='));
    }
}
