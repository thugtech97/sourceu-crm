<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use App\Models\DialpadWebhookLog;
use App\Services\DialpadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DialpadWebhookController extends Controller
{
    public function __construct(
        private readonly DialpadService $dialpad,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        if (! $this->signatureIsValid($request)) {
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
        if (! $callId) {
            return;
        }

        match ($eventType) {
            'call.initiated' => $this->onCallInitiated($payload, $callId),
            'call.connected' => $this->onCallConnected($payload, $callId),
            'call.ended' => $this->onCallEnded($payload, $callId),
            'call.missed' => $this->onCallMissed($payload, $callId),
            'call.recording_ready' => $this->onRecordingReady($payload, $callId),
            'call.transcription_ready' => $this->onTranscriptionReady($payload, $callId),
            default => null,
        };
    }

    private function onCallInitiated(array $payload, string $callId): void
    {
        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            return;
        }

        $callLog->update(['status' => 'initiated', 'dialpad_payload' => $payload]);
    }

    private function onCallConnected(array $payload, string $callId): void
    {
        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            return;
        }

        $callLog->update([
            'status' => 'connected',
            'connected_at' => now(),
            'dialpad_payload' => array_merge($callLog->dialpad_payload ?? [], $payload),
        ]);
    }

    private function onCallEnded(array $payload, string $callId): void
    {
        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            return;
        }

        $callLog->update([
            'status' => 'ended',
            'ended_at' => now(),
            'duration_seconds' => $payload['duration'] ?? $payload['duration_seconds'] ?? null,
            'dialpad_payload' => array_merge($callLog->dialpad_payload ?? [], $payload),
        ]);
    }

    private function onCallMissed(array $payload, string $callId): void
    {
        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            return;
        }

        $callLog->update([
            'status' => 'missed',
            'ended_at' => now(),
            'dialpad_payload' => array_merge($callLog->dialpad_payload ?? [], $payload),
        ]);
    }

    private function onRecordingReady(array $payload, string $callId): void
    {
        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            return;
        }

        // First try to get URL from payload
        $recordingUrl = $payload['recording_url'] ?? $payload['url'] ?? null;

        // If not in payload, fetch from Dialpad API
        if (! $recordingUrl) {
            try {
                $recordingUrl = $this->dialpad->getRecordingUrl($callId);
            } catch (\Exception $e) {
                Log::warning('Failed to fetch recording URL from Dialpad API', [
                    'call_id' => $callId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($recordingUrl) {
            $callLog->update(['recording_url' => $recordingUrl]);
            Log::info('Recording URL stored for call', [
                'call_id' => $callId,
                'recording_url' => $recordingUrl,
            ]);
        }
    }

    private function onTranscriptionReady(array $payload, string $callId): void
    {
        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            return;
        }

        // First try to get transcript from payload
        $transcriptText = $payload['transcript'] ?? $payload['text'] ?? null;
        $transcriptUrl = $payload['transcript_url'] ?? null;

        // If not in payload, fetch from Dialpad API
        if (! $transcriptText) {
            try {
                $transcriptText = $this->dialpad->getTranscript($callId);
            } catch (\Exception $e) {
                Log::warning('Failed to fetch transcript from Dialpad API', [
                    'call_id' => $callId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($transcriptText || $transcriptUrl) {
            $callLog->update([
                'transcript_url' => $transcriptUrl,
                'transcript_text' => $transcriptText,
            ]);

            Log::info('Transcript stored for call', [
                'call_id' => $callId,
                'has_text' => (bool) $transcriptText,
                'has_url' => (bool) $transcriptUrl,
            ]);
        }
    }

    private function signatureIsValid(Request $request): bool
    {
        $secret = config('services.dialpad.webhook_secret');

        if (! $secret) {
            return app()->environment('local');
        }

        $signature = $request->header('X-Dialpad-Signature') ?? $request->header('Dialpad-Signature');

        if (! $signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, ltrim($signature, 'sha256='));
    }
}
