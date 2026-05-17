<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'dialpad' => [
        'api_key' => env('DIALPAD_API_KEY'),
        'webhook_secret' => env('DIALPAD_WEBHOOK_SECRET'),
        'base_url' => env('DIALPAD_BASE_URL', 'https://dialpad.com/api/v2'),
        'access_control_policy_id' => env('DIALPAD_ACCESS_CONTROL_POLICY_ID'),
        'access_control_target_type' => env('DIALPAD_ACCESS_CONTROL_TARGET_TYPE', 'company'),
        'access_control_target_id' => env('DIALPAD_ACCESS_CONTROL_TARGET_ID'),
    ],

    'zapier' => [
        'lead_webhook_secret' => env('ZAPIER_LEAD_WEBHOOK_SECRET'),
        'lead_owner_email' => env('ZAPIER_LEAD_OWNER_EMAIL'),
    ],

];
