<?php

namespace App\Services;

use App\Models\CallLog;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DialpadService
{
    public function initiateCall(Contact $contact, User $rep): CallLog
    {
        if (! config('services.dialpad.api_key')) {
            throw new \RuntimeException('Dialpad API key is not configured.');
        }

        if (! $rep->dialpad_user_id) {
            throw new \RuntimeException('Connect your Dialpad account before placing calls.');
        }

        if (! $contact->phone) {
            throw new \RuntimeException('This contact has no phone number.');
        }

        $response = $this->post('/call', [
            'phone_number' => $this->normalisePhone($contact->phone),
            'user_id' => $rep->dialpad_user_id,
            'outbound_caller_id' => $rep->dialpad_number,
            'custom_data' => json_encode([
                'crm_contact_id' => $contact->id,
                'crm_rep_id' => $rep->id,
            ]),
        ]);

        if (! $response->successful()) {
            Log::error('Dialpad call initiation failed', [
                'contact_id' => $contact->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Dialpad call failed: '.($response->json('message') ?? $response->body()));
        }

        $data = $response->json();

        return CallLog::create([
            'contact_id' => $contact->id,
            'user_id' => $rep->id,
            'dialpad_call_id' => $data['call_id'] ?? $data['id'],
            'dialpad_user_id' => $rep->dialpad_user_id,
            'direction' => 'outbound',
            'status' => 'initiated',
            'dialpad_payload' => $data,
            'started_at' => now(),
        ]);
    }

    public function findUserByEmail(string $email): ?array
    {
        if (! config('services.dialpad.api_key')) {
            throw new \RuntimeException('Dialpad API key is not configured.');
        }

        $response = $this->get('/users', ['email' => $email]);

        if ($response->status() === 401) {
            throw new \RuntimeException('Dialpad rejected the API key. Please check DIALPAD_API_KEY and make sure it has users:read scope.');
        }

        if (! $response->successful()) {
            throw new \RuntimeException('Dialpad user lookup failed. Status: '.$response->status());
        }

        $needle = str($email)->lower()->toString();

        return collect($response->json('items') ?? [])
            ->first(fn (array $user) => collect($user['emails'] ?? [$user['email'] ?? null])
                ->filter()
                ->contains(fn (string $candidate) => str($candidate)->lower()->toString() === $needle));
    }

    public function testUserLookup(string $email): array
    {
        if (! config('services.dialpad.api_key')) {
            throw new \RuntimeException('Dialpad API key is not configured.');
        }

        $response = $this->get('/users', ['email' => $email]);
        $items = collect($response->json('items') ?? []);
        $needle = str($email)->lower()->toString();
        $matchedUser = $items->first(fn (array $user) => collect($user['emails'] ?? [$user['email'] ?? null])
            ->filter()
            ->contains(fn (string $candidate) => str($candidate)->lower()->toString() === $needle));

        return [
            'email' => $email,
            'endpoint' => config('services.dialpad.base_url').'/users?'.http_build_query(['email' => $email]),
            'status' => $response->status(),
            'successful' => $response->successful(),
            'item_count' => $items->count(),
            'matched' => (bool) $matchedUser,
            'matched_user' => $matchedUser ? $this->summarizeUser($matchedUser) : null,
            'items' => $items->take(5)->map(fn (array $user) => $this->summarizeUser($user))->values()->all(),
            'message' => $response->json('message'),
        ];
    }

    public function assignConfiguredAccessControlPolicy(array $dialpadUser): void
    {
        $policyId = config('services.dialpad.access_control_policy_id');

        if (! $policyId) {
            return;
        }

        if (empty($dialpadUser['id'])) {
            throw new \RuntimeException('Dialpad user lookup did not return a user id.');
        }

        $payload = [
            'user_id' => $dialpadUser['id'],
            'target_type' => config('services.dialpad.access_control_target_type', 'company'),
        ];

        if (config('services.dialpad.access_control_target_id')) {
            $payload['target_id'] = config('services.dialpad.access_control_target_id');
        }

        $response = $this->post("/accesscontrolpolicies/{$policyId}/assign", $payload);

        if ($response->status() === 401) {
            throw new \RuntimeException('Dialpad rejected the API key. Access control policy assignment requires a company admin API key.');
        }

        if (! $response->successful()) {
            Log::error('Dialpad access control policy assignment failed', [
                'policy_id' => $policyId,
                'user_id' => $dialpadUser['id'],
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Dialpad policy assignment failed: '.($response->json('message') ?? $response->body()));
        }
    }

    public function registerWebhook(string $url): array
    {
        $response = $this->post('/webhooks', [
            'hook_url' => $url,
            'enabled' => true,
            'secret' => config('services.dialpad.webhook_secret'),
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Dialpad webhook registration failed: '.$response->body());
        }

        return $response->json() ?? [];
    }

    private function get(string $endpoint, array $params = []): Response
    {
        return Http::withHeaders($this->headers())
            ->timeout(15)
            ->retry(2, 500, throw: false)
            ->get(config('services.dialpad.base_url').$endpoint, $params);
    }

    private function post(string $endpoint, array $data = []): Response
    {
        return Http::withHeaders($this->headers())
            ->timeout(15)
            ->retry(2, 500, throw: false)
            ->post(config('services.dialpad.base_url').$endpoint, $data);
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.config('services.dialpad.api_key'),
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    private function normalisePhone(string $phone): string
    {
        $phone = preg_replace('/[^\d+]/', '', $phone) ?? $phone;

        return str_starts_with($phone, '+') ? $phone : '+'.$phone;
    }

    private function summarizeUser(array $user): array
    {
        return [
            'id' => $user['id'] ?? null,
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'emails' => $user['emails'] ?? null,
            'phone_number' => $user['phone_number'] ?? null,
            'state' => $user['state'] ?? null,
            'is_admin' => $user['is_admin'] ?? null,
        ];
    }

    public function getCallDetails(string $callId): ?array
    {
        if (! config('services.dialpad.api_key')) {
            throw new \RuntimeException('Dialpad API key is not configured.');
        }

        try {
            $response = $this->get("/calls/{$callId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Dialpad call details fetch failed', [
                'call_id' => $callId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Dialpad call details fetch exception', [
                'call_id' => $callId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function getTranscript(string $callId): ?string
    {
        $callDetails = $this->getCallDetails($callId);

        if (! $callDetails) {
            return null;
        }

        // Try different possible transcript fields
        return $callDetails['transcript']
            ?? $callDetails['transcription']
            ?? $callDetails['transcript_text']
            ?? $callDetails['call_transcript']
            ?? null;
    }

    public function getRecordingUrl(string $callId): ?string
    {
        $callDetails = $this->getCallDetails($callId);

        if (! $callDetails) {
            return null;
        }

        // Try different possible recording URL fields
        return $callDetails['recording_url']
            ?? $callDetails['recording']
            ?? $callDetails['call_recording_url']
            ?? $callDetails['media_url']
            ?? null;
    }
}
