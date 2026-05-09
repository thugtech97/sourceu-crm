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
        if (!config('services.dialpad.api_key')) {
            throw new \RuntimeException('Dialpad API key is not configured.');
        }

        if (!$rep->dialpad_user_id) {
            throw new \RuntimeException('Connect your Dialpad account before placing calls.');
        }

        if (!$contact->phone) {
            throw new \RuntimeException('This contact has no phone number.');
        }

        $response = $this->post('/calls', [
            'phone_number' => $this->normalisePhone($contact->phone),
            'user_id' => $rep->dialpad_user_id,
            'outbound_caller_id' => $rep->dialpad_number,
            'custom_data' => json_encode([
                'crm_contact_id' => $contact->id,
                'crm_rep_id' => $rep->id,
            ]),
        ]);

        if (!$response->successful()) {
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
        if (!config('services.dialpad.api_key')) {
            throw new \RuntimeException('Dialpad API key is not configured.');
        }

        $response = $this->get('/users', ['email' => $email]);

        if ($response->status() === 401) {
            throw new \RuntimeException('Dialpad rejected the API key. Please check DIALPAD_API_KEY and make sure it has users:read scope.');
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Dialpad user lookup failed. Status: '.$response->status());
        }

        return collect($response->json('items') ?? [])->firstWhere('email', $email);
    }

    public function registerWebhook(string $url): array
    {
        $response = $this->post('/webhooks', [
            'hook_url' => $url,
            'enabled' => true,
            'secret' => config('services.dialpad.webhook_secret'),
        ]);

        if (!$response->successful()) {
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
}
