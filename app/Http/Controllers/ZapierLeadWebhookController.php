<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\DncList;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ZapierLeadWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $secret = config('services.zapier.lead_webhook_secret');

        if (! $secret) {
            return response()->json(['message' => 'Zapier lead webhook is not configured.'], 503);
        }

        $providedSecret = $request->header('X-SourceU-Webhook-Secret') ?? $request->input('secret');

        if (! is_string($providedSecret) || ! hash_equals($secret, $providedSecret)) {
            return response()->json(['message' => 'Invalid webhook secret.'], 403);
        }

        $owner = $this->owner();

        if (! $owner) {
            return response()->json(['message' => 'No CRM owner is available for incoming leads.'], 422);
        }

        $payload = Arr::except($request->all(), ['secret']);
        $lead = $this->normaliseLead($payload);

        // Block DNC contacts at the gate — never enter the pool.
        if (DncList::blocks($lead['phone'], $lead['email'])) {
            return response()->json(['message' => 'Lead is on the DNC list and was rejected.', 'dnc' => true]);
        }

        $sourceType = $this->resolveSourceType($lead, $payload);

        $contact = $this->contactFor($owner, $lead);
        $contact->fill([
            'owner_id' => $owner->id,
            'first_name' => $lead['first_name'],
            'last_name' => $lead['last_name'],
            'email' => $lead['email'],
            'phone' => $lead['phone'],
            'job_title' => $lead['role'],
            'status' => 'lead',
            'notes' => $this->leadNotes($lead, $payload),
        ]);
        $contact->save();

        Activity::create([
            'owner_id' => $owner->id,
            'contact_id' => $contact->id,
            'type' => 'note',
            'subject' => 'Lead received from '.($lead['source'] ?: 'Zapier'),
            'body' => $this->leadNotes($lead, $payload),
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Lead saved.',
            'contact_id' => $contact->id,
            'source_type' => $sourceType,
        ]);
    }

    private function owner(): ?User
    {
        $ownerEmail = config('services.zapier.lead_owner_email');

        if ($ownerEmail) {
            return User::query()->where('email', $ownerEmail)->first();
        }

        return User::query()->orderBy('id')->first();
    }

    /**
     * Determine source type from the payload. Pass `source_type=cold` in the
     * webhook payload to route to the cold calling team; defaults to inbound.
     *
     * @param  array<string, string|null>  $lead
     * @param  array<string, mixed>  $payload
     */
    private function resolveSourceType(array $lead, array $payload): string
    {
        $raw = $this->value($payload, ['source_type', 'lead_type', 'type']);

        if ($raw && Str::lower($raw) === 'cold') {
            return Contact::SOURCE_COLD;
        }

        return Contact::SOURCE_INBOUND;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string|null>
     */
    private function normaliseLead(array $payload): array
    {
        $fullName = $this->value($payload, ['full_name', 'Full Name', 'name', 'Name']);
        [$firstName, $lastName] = $this->splitName($fullName);

        return [
            'first_name' => $this->value($payload, ['first_name', 'First Name']) ?: $firstName,
            'last_name' => $this->value($payload, ['last_name', 'Last Name']) ?: $lastName,
            'email' => $this->value($payload, ['email', 'Email', 'Contact Email']),
            'phone' => $this->value($payload, ['phone', 'Phone', 'Contact Phone']),
            'role' => $this->value($payload, ['role', 'Role', 'job_title', 'What role are you looking to hire for?']),
            'region' => $this->value($payload, ['region', 'Remote Talent Region', 'Where would you like to hire remote talent from?']),
            'budget' => $this->value($payload, ['budget', 'Budget', 'What is your monthly budget for the role?']),
            'message' => $this->value($payload, ['message', 'Message', 'notes', 'Anything else you would like us to know?']),
            'state' => $this->value($payload, ['state', 'State']),
            'source' => $this->value($payload, ['source', 'Source', 'Lead Source']),
            'form_name' => $this->value($payload, ['form_name', 'Form name', 'Form Name']),
        ];
    }

    /**
     * @param  array<string, string|null>  $lead
     */
    private function contactFor(User $owner, array $lead): Contact
    {
        if ($lead['email']) {
            return Contact::query()
                ->where('owner_id', $owner->id)
                ->where('email', $lead['email'])
                ->firstOrNew();
        }

        return new Contact;
    }

    /**
     * @param  array<string, string|null>  $lead
     * @param  array<string, mixed>  $payload
     */
    private function leadNotes(array $lead, array $payload): string
    {
        $lines = [
            'Received from: '.($lead['source'] ?: 'Zapier'),
            'Form: '.($lead['form_name'] ?: 'n/a'),
            'Region: '.($lead['region'] ?: 'n/a'),
            'Role: '.($lead['role'] ?: 'n/a'),
            'Budget: '.($lead['budget'] ?: 'n/a'),
            'State: '.($lead['state'] ?: 'n/a'),
            'Message: '.($lead['message'] ?: 'n/a'),
            '',
            'Raw payload:',
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}',
        ];

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function value(array $payload, array $keys): ?string
    {
        $normalisedPayload = [];

        foreach ($payload as $key => $value) {
            $normalisedPayload[$this->normaliseKey((string) $key)] = $value;
        }

        foreach ($keys as $key) {
            $value = $normalisedPayload[$this->normaliseKey($key)] ?? null;

            if (is_scalar($value) && trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }

        return null;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(?string $fullName): array
    {
        $parts = preg_split('/\s+/', trim((string) $fullName), flags: PREG_SPLIT_NO_EMPTY) ?: [];

        if (count($parts) === 0) {
            return ['Unknown', 'Lead'];
        }

        if (count($parts) === 1) {
            return [$parts[0], 'Lead'];
        }

        return [array_shift($parts), implode(' ', $parts)];
    }

    private function normaliseKey(string $key): string
    {
        return Str::of($key)->lower()->replaceMatches('/[^a-z0-9]+/', '')->toString();
    }
}
