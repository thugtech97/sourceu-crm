# Dialpad Integration Setup & Testing Guide

## Overview

This document provides comprehensive instructions for integrating Dialpad with the SourceU CRM application, including sandbox testing setup and troubleshooting.

## Current Integration Status

✅ **Fully Implemented Features:**
- User Dialpad account connection
- Outbound call initiation from CRM
- Call logging and tracking
- Webhook event processing (initiated, connected, ended, missed, recording ready, transcription ready)
- Automatic lead claim on call initiation
- Call recordings and transcription integration
- User lookup by email

## Prerequisites

1. **Dialpad Account**: You need a Dialpad account with API access
2. **API Key**: Obtained from Dialpad dashboard
3. **Webhook Secret**: Generated and configured in your app
4. **Sandbox Access**: Optional, for testing without production calls

## Environment Configuration

### 1. Basic Setup (.env)

Your `.env` file should contain:

```env
# Production Dialpad
DIALPAD_API_KEY=your_api_key_here
DIALPAD_WEBHOOK_SECRET=your_webhook_secret_here
DIALPAD_BASE_URL=https://dialpad.com/api/v2

# Sandbox Configuration (optional)
DIALPAD_SANDBOX_MODE=false
DIALPAD_SANDBOX_BASE_URL=https://sandbox.dialpad.com/api/v2

# Optional: Access Control Policies (for user provisioning)
DIALPAD_ACCESS_CONTROL_POLICY_ID=
DIALPAD_ACCESS_CONTROL_TARGET_TYPE=company
DIALPAD_ACCESS_CONTROL_TARGET_ID=
```

### 2. Getting Your API Key

#### From Dialpad Production:
1. Go to https://dialpad.com
2. Log in with your account
3. Navigate to **Settings** → **Integrations & API**
4. Generate a new API key with `users:read` and `calls:write` scopes
5. Copy the key to `DIALPAD_API_KEY` in `.env`

#### For Sandbox Testing:
1. Access the sandbox environment: https://sandbox.dialpad.com
2. Follow the same steps as above
3. You can optionally set `DIALPAD_SANDBOX_MODE=true` to use the sandbox API

## Testing the Integration

### Access the Test Dashboard

Navigate to: `http://localhost:8000/dialpad/test/dashboard`

This dashboard provides:
- API connection status
- Current configuration details
- Connected users list
- Recent call logs
- Webhook event logs
- Real-time testing tools

### Test Endpoints (JSON API)

#### 1. Test Connection to Dialpad API

```bash
curl -X POST http://localhost:8000/dialpad/test/connection \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Connected to Dialpad API successfully",
  "status": 200,
  "sandbox_mode": false,
  "base_url": "https://dialpad.com/api/v2"
}
```

#### 2. Test User Lookup

```bash
curl -X POST http://localhost:8000/dialpad/test/user-lookup \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"email": "user@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "endpoint": "https://dialpad.com/api/v2/users?email=user@example.com",
    "status": 200,
    "successful": true,
    "item_count": 1,
    "matched": true,
    "matched_user": {
      "id": "12345",
      "name": "John Doe",
      "email": "user@example.com",
      "phone_number": "+1234567890"
    }
  }
}
```

#### 3. Get Current Status

```bash
curl http://localhost:8000/dialpad/test/status
```

#### 4. Get Call Logs

```bash
curl "http://localhost:8000/dialpad/test/call-logs?limit=20"
```

#### 5. Get Webhook Logs

```bash
curl "http://localhost:8000/dialpad/test/webhook-logs?limit=20"
```

### Step-by-Step Testing Process

#### Step 1: Verify API Configuration
1. Open the test dashboard
2. Check that "API Key" shows "Configured"
3. Note the API Base URL

#### Step 2: Test Connection
1. Click "Test Connection" button
2. Should see: "✓ Connected successfully (200)"
3. If failed, verify:
   - DIALPAD_API_KEY is correct
   - API key has correct permissions
   - Network connectivity is working

#### Step 3: Test User Lookup
1. Enter a Dialpad user's email in the lookup field
2. Click "Search"
3. Should see the user information
4. If failed, verify:
   - Email is correct
   - User exists in your Dialpad account
   - API key has `users:read` scope

#### Step 4: Connect a User in CRM
1. Go to **Settings** (or profile menu)
2. Click "Connect Dialpad"
3. Enter the email of a Dialpad user
4. Click "Connect"
5. User should now have a Dialpad User ID and phone number

#### Step 5: Make a Test Call
1. Go to **Leads Pool**
2. Find a lead with a phone number
3. Click the **Phone** icon to initiate a call
4. Your Dialpad phone should ring
5. Check the test dashboard for the call log entry

## Database Schema

The integration uses the following tables:

### call_logs
```sql
- id: int
- contact_id: int
- user_id: int
- dialpad_call_id: string
- dialpad_user_id: string
- direction: enum(inbound, outbound)
- status: enum(initiated, connected, completed, missed, failed)
- duration_seconds: int
- recording_url: string
- transcript_url: string
- transcript_text: text
- disposition_set: boolean
- dialpad_payload: json
- started_at: timestamp
- connected_at: timestamp
- ended_at: timestamp
```

### dialpad_webhook_logs
```sql
- id: int
- dialpad_call_id: string
- event_type: string
- payload: json
- processed: boolean
- error: string
- created_at: timestamp
- updated_at: timestamp
```

### users (Dialpad fields)
```sql
- dialpad_user_id: string
- dialpad_number: string
- dialpad_connected: boolean
```

### contacts
```sql
- dialpad_contact_id: string (optional)
```

## Sandbox Testing Mode

### Enabling Sandbox Mode

```env
DIALPAD_SANDBOX_MODE=true
DIALPAD_SANDBOX_BASE_URL=https://sandbox.dialpad.com/api/v2
```

### Sandbox Benefits
- Test API calls without production impact
- Use test phone numbers
- Verify webhook handling
- Practice integration workflows

### Note
Sandbox API may have different features/limitations than production. Check Dialpad's sandbox documentation for specific endpoints and data availability.

## Webhook Integration

### Webhook Events

The app automatically processes these Dialpad webhook events:

| Event | Handler | Action |
|-------|---------|--------|
| `call.initiated` | `onCallInitiated()` | Log call start, auto-claim lead if in pool |
| `call.connected` | `onCallConnected()` | Update call status to connected |
| `call.ended` | `onCallEnded()` | Complete call, calculate duration |
| `call.missed` | `onCallMissed()` | Mark call as missed |
| `call.recording_ready` | `onRecordingReady()` | Store recording URL |
| `call.transcription_ready` | `onTranscriptionReady()` | Store transcript |

### Setting Up Webhooks

1. In Dialpad dashboard, go to **Settings → Webhooks**
2. Add a new webhook with URL: `https://your-domain.com/webhooks/dialpad`
3. Set the webhook secret to match `DIALPAD_WEBHOOK_SECRET` in your `.env`
4. Select events: `call.initiated`, `call.connected`, `call.ended`, `call.recording_ready`, `call.transcription_ready`

### Testing Webhooks Locally

For local development, you'll need to expose your local app to the internet. Options:

1. **ngrok**: 
   ```bash
   ngrok http 8000
   ```
   Then use the generated URL: `https://xxxx-xx-xxx-xxx-xx.ngrok.io/webhooks/dialpad`

2. **localtunnel**:
   ```bash
   lt --port 8000
   ```

3. **Docker + Expose**: Use a service like Expose or your hosting provider's tunnel

## Common Issues & Solutions

### Issue: "API key is not configured"
**Solution**: 
- Check `.env` has `DIALPAD_API_KEY` set
- Verify the key is correct from your Dialpad account
- Run `php artisan config:cache` to refresh config

### Issue: "No Dialpad user found for that email"
**Solution**:
- Verify email exists in your Dialpad account
- Check email spelling is exact
- Ensure API key has `users:read` scope
- User must be active in Dialpad

### Issue: "Connect your Dialpad account before placing calls"
**Solution**:
- User must first connect their Dialpad account
- Go to Settings → Connect Dialpad
- Enter their Dialpad email
- They should see their phone number after connecting

### Issue: "This contact has no phone number"
**Solution**:
- Add a phone number to the contact
- Phone must be in valid format (with or without +1)

### Issue: Webhooks not being received
**Solution**:
- Verify webhook URL is publicly accessible
- Check webhook secret matches in Dialpad and `.env`
- Confirm webhook is enabled in Dialpad settings
- Check `dialpad_webhook_logs` table for any errors
- Test with: `curl -X POST http://localhost:8000/webhooks/dialpad`

## Artisan Commands

```bash
# Check current configuration
php artisan config:show services.dialpad

# Test database connection
php artisan db:seed

# View call logs
php artisan tinker
>>> \App\Models\CallLog::latest()->get();

# View webhook logs
>>> \App\Models\DialpadWebhookLog::latest()->get();
```

## Monitoring

### Real-Time Logs
```bash
php artisan pail --filter=dialpad
```

### Recent Calls Query
```bash
php artisan tinker
>>> \App\Models\CallLog::latest()->limit(5)->with('contact', 'user')->get();
```

### Failed Webhooks
```bash
php artisan tinker
>>> \App\Models\DialpadWebhookLog::where('processed', false)->get();
```

## Migration to Production

1. **Switch to Production URL**:
   ```env
   DIALPAD_SANDBOX_MODE=false
   ```

2. **Update API Key**:
   - Get production API key from Dialpad
   - Update `DIALPAD_API_KEY`

3. **Configure Webhooks**:
   - Update webhook URL to your production domain
   - Ensure SSL/HTTPS is enabled

4. **Test End-to-End**:
   - Make test calls from dashboard
   - Verify calls appear in CRM
   - Check webhooks are processed

5. **Monitor**:
   - Check logs for errors
   - Monitor call success rate
   - Track webhook processing time

## API Reference

### Key Endpoints

- `POST /contacts/{contact}/dialpad/dial` - Initiate a call
- `POST /dialpad/connect` - Connect user's Dialpad account
- `POST /dialpad/test-lookup` - Test user lookup
- `POST /webhooks/dialpad` - Receive Dialpad webhooks

### Test Endpoints

- `GET /dialpad/test/dashboard` - View test dashboard
- `GET /dialpad/test/status` - Get integration status
- `POST /dialpad/test/connection` - Test API connection
- `POST /dialpad/test/user-lookup` - Test user lookup
- `GET /dialpad/test/call-logs` - Get call logs
- `GET /dialpad/test/webhook-logs` - Get webhook logs

## Support & Further Help

- **Dialpad Docs**: https://developers.dialpad.com
- **SourceU Support**: Check CLAUDE.md for guidelines
- **GitHub Issues**: Report bugs on the project repository

## Checklist

- [ ] DIALPAD_API_KEY configured in .env
- [ ] DIALPAD_WEBHOOK_SECRET configured in .env
- [ ] Test connection successful from dashboard
- [ ] User can connect their Dialpad account
- [ ] Test call works from leads pool
- [ ] Call appears in call logs
- [ ] Webhooks are configured (optional)
- [ ] Monitoring is set up
