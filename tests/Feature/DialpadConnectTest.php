<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

test('user can connect dialpad account matched by secondary email ignoring case', function () {
    config([
        'services.dialpad.api_key' => 'test-token',
        'services.dialpad.access_control_policy_id' => null,
    ]);

    Http::fake([
        'https://dialpad.com/api/v2/users*' => Http::response([
            'items' => [
                [
                    'id' => 123,
                    'email' => 'primary@example.com',
                    'emails' => ['primary@example.com', 'Jude.Escol@SourceU.ai'],
                    'phone_number' => '+15551234567',
                ],
            ],
        ]),
    ]);

    $user = User::factory()->create([
        'email' => 'jude.escol@sourceu.ai',
    ]);

    $this
        ->actingAs($user)
        ->post('/dialpad/connect', [
            'email' => 'jude.escol@sourceu.ai',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($user->refresh())
        ->dialpad_user_id->toBe('123')
        ->dialpad_number->toBe('+15551234567')
        ->dialpad_connected->toBeTrue();
});

test('dialpad connect assigns configured access control policy', function () {
    config([
        'services.dialpad.api_key' => 'test-token',
        'services.dialpad.access_control_policy_id' => '456',
        'services.dialpad.access_control_target_type' => 'company',
        'services.dialpad.access_control_target_id' => null,
    ]);

    Http::fake([
        'https://dialpad.com/api/v2/users*' => Http::response([
            'items' => [
                [
                    'id' => 123,
                    'email' => 'jude.escol@sourceu.ai',
                    'phone_number' => '+15551234567',
                ],
            ],
        ]),
        'https://dialpad.com/api/v2/accesscontrolpolicies/456/assign' => Http::response([], 200),
    ]);

    $user = User::factory()->create([
        'email' => 'jude.escol@sourceu.ai',
    ]);

    $this
        ->actingAs($user)
        ->post('/dialpad/connect', [
            'email' => 'jude.escol@sourceu.ai',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    Http::assertSent(fn ($request) => $request->url() === 'https://dialpad.com/api/v2/accesscontrolpolicies/456/assign'
        && $request['user_id'] === 123
        && $request['target_type'] === 'company');
});
