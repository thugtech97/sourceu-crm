# Dialpad Transcript and Recording Fix

## Problem Identified

Transcripts and recordings were remaining empty after calls completed, even though the webhook infrastructure was in place and webhook logs showed events being received.

### Root Cause

The previous implementation assumed that Dialpad would include the full transcript text and recording URL in the webhook event payload. However, Dialpad only sends a **notification event** (e.g., `call.transcription_ready`, `call.recording_ready`) indicating that these resources are now available—the actual data must be fetched from the Dialpad API.

**Previous Code (Broken):**
```php
private function onTranscriptionReady(array $payload, string $callId): void
{
    CallLog::where('dialpad_call_id', $callId)
        ->update([
            'transcript_url' => $payload['transcript_url'] ?? null,
            'transcript_text' => $payload['transcript'] ?? $payload['text'] ?? null,
        ]);
}
```

This approach would almost always store `null` values because:
- The webhook payload notifies that a transcript is ready
- It doesn't contain the actual transcript text
- We need to actively fetch it from the API when the webhook arrives

## Solution Implemented

### 1. Enhanced DialpadService

Added three new methods to `app/Services/DialpadService.php`:

- **`getCallDetails(string $callId): ?array`** - Fetches complete call details from Dialpad API including transcript and recording metadata
- **`getTranscript(string $callId): ?string`** - Extracts transcript text from call details with fallback on multiple field name attempts
- **`getRecordingUrl(string $callId): ?string`** - Extracts recording URL from call details with multiple field name attempts

These methods handle:
- API request execution with error handling
- Fallback field names (Dialpad API may use different naming)
- Graceful null returns when data isn't available yet

### 2. Improved Webhook Handlers

Updated `app/Http/Controllers/DialpadWebhookController.php`:

**onRecordingReady()** now:
1. First checks if recording URL is in the webhook payload
2. If not found, makes an API call to fetch it
3. Logs success/failure with debug information
4. Only updates CallLog if a URL is found

**onTranscriptionReady()** now:
1. First checks if transcript is in the webhook payload  
2. If not found, makes an API call to fetch it
3. Validates both transcript text and URL
4. Logs the operation for auditing

### 3. New Test Endpoints

Added debugging endpoints under `/dialpad/test/*`:

- **POST `/dialpad/test/fetch-transcript`** - Manually fetch transcript for a specific call
  - Parameter: `call_id` (required)
  - Response includes truncated transcript preview and recording URL status

- **GET `/dialpad/test/calls-without-transcripts`** - List all ended calls still missing transcripts
  - Useful for identifying problematic calls
  - Returns up to 50 recent calls

### 4. Artisan Command

New command: `php artisan dialpad:fetch-transcripts`

**Usage:**
```bash
# Fetch transcript for a specific call
php artisan dialpad:fetch-transcripts --call-id=1234567890

# Batch fetch for 50 recent calls without transcripts (default)
php artisan dialpad:fetch-transcripts

# Batch fetch for 100 calls
php artisan dialpad:fetch-transcripts --limit=100
```

This allows manual retry if webhooks are missed or if you want to backfill existing data.

## How It Works End-to-End

```
1. User dials contact → Call initiated
2. Call ends → webhook 'call.ended' received
3. Call transcription processing by Dialpad...
4. Transcription ready → webhook 'call.transcription_ready' received
   ├─ Check payload for transcript (usually empty)
   ├─ Call Dialpad API: GET /calls/{callId}
   ├─ Extract transcript_text from response
   └─ Store in CallLog.transcript_text

5. User clicks "View Transcript" button
6. Frontend fetches from GET /contacts/{contactId}/dialpad/transcripts
7. DialpadController.getCallTranscripts() queries CallLog where transcript_text IS NOT NULL
8. TranscriptModal displays list with full transcript text
```

## Deployment Steps

1. **Run migration** (if table schema needs updating - check if `transcript_text` column exists):
   ```bash
   php artisan migrate
   ```

2. **Clear config cache**:
   ```bash
   php artisan config:cache
   ```

3. **Rebuild frontend**:
   ```bash
   npm run build
   ```

4. **Test in sandbox**:
   ```bash
   # Check calls without transcripts
   php artisan dialpad:fetch-transcripts --limit=10
   
   # Or test via API
   curl http://localhost:8000/dialpad/test/calls-without-transcripts
   ```

5. **Make a test call** in the application and verify transcripts populate within 30-60 seconds after call ends

## Debugging

### Check if webhooks are being received:
```bash
GET /dialpad/test/webhook-logs
```

### Check if API credentials work:
```bash
POST /dialpad/test/connection
```

### Manually fetch transcript for a call:
```bash
POST /dialpad/test/fetch-transcript?call_id=123456
```

### See calls still waiting for transcripts:
```bash
GET /dialpad/test/calls-without-transcripts
```

### Run retry command:
```bash
php artisan dialpad:fetch-transcripts --verbose
```

## Files Modified

- ✅ `app/Services/DialpadService.php` - Added three new methods
- ✅ `app/Http/Controllers/DialpadWebhookController.php` - Updated webhook handlers with API fetching
- ✅ `app/Http/Controllers/DialpadTestController.php` - Added two new debugging endpoints
- ✅ `app/Console/Commands/FetchDialpadTranscripts.php` - New Artisan command
- ✅ `routes/web.php` - Added two new test routes

## Frontend Components (No Changes)

The following components work correctly with the new implementation:

- `resources/js/pages/crm/leads/pool.tsx` - TranscriptModal already fetches correctly
- `resources/js/pages/dialpad/Dashboard.tsx` - Test dashboard works as-is

## Testing Recommended

1. **Make a test call** in the application
2. **Wait 30-60 seconds** for Dialpad to process transcription
3. **Check webhook logs**: `GET /dialpad/test/webhook-logs` - verify `call.transcription_ready` event received
4. **Click transcript icon** in My Leads - verify transcript displays
5. **Check recording**: verify download link works if recording is available

## Troubleshooting

### Transcripts still empty after waiting?

**Step 1:** Check if webhook is configured in Dialpad dashboard
```bash
GET /dialpad/test/webhook-logs
```
Should show `call.transcription_ready` events arriving. If no events, webhooks not configured.

**Step 2:** Verify API credentials
```bash
POST /dialpad/test/connection
```
Should return `"success": true`

**Step 3:** Manually fetch for debugging
```bash
POST /dialpad/test/fetch-transcript?call_id=YOUR_CALL_ID
```
Response shows if API can retrieve the transcript.

### Seeing API errors in logs?

Check `/storage/logs/laravel.log` for:
- API authentication failures → verify `DIALPAD_API_KEY` is correct
- Network timeouts → verify Dialpad API is accessible
- Missing fields in response → might indicate API version mismatch

## Future Improvements

1. Consider storing raw transcript response for audit/debugging
2. Add webhook delivery retry logic if API fetch fails
3. Support for multiple transcript language variants if Dialpad provides
4. Cache transcript API responses to reduce API quota usage
5. Add transcript search indexing for search capabilities
