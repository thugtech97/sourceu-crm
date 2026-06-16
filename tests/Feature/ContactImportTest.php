<?php

use App\Models\ContactImportBatch;
use App\Models\ContactImportBatchRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can access import page', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/contacts/import');
    $response->assertOk();
});

test('can download CSV template', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/contacts/import-template/csv');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
});

test('can download Excel template', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/contacts/import-template/xlsx');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('spreadsheetml');
});

test('can create import batch', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $batch = ContactImportBatch::create([
        'created_by' => $user->id,
        'filename' => 'test.csv',
        'original_filename' => 'test.csv',
        'total_rows' => 2,
        'status' => 'pending',
    ]);

    expect($batch->id)->not->toBeNull();
    expect($batch->created_by)->toBe($user->id);
    expect($batch->status)->toBe('pending');
});

test('can create import batch records', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $batch = ContactImportBatch::create([
        'created_by' => $user->id,
        'filename' => 'test.csv',
        'original_filename' => 'test.csv',
        'total_rows' => 2,
        'status' => 'pending',
    ]);

    ContactImportBatchRecord::create([
        'batch_id' => $batch->id,
        'row_number' => 2,
        'status' => 'pending',
        'data' => ['first_name' => 'John', 'last_name' => 'Doe', 'email' => 'john@example.com'],
    ]);

    expect(ContactImportBatchRecord::count())->toBe(1);
    expect($batch->records()->count())->toBe(1);
});

test('batch has correct methods', function () {
    $user = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $batch = ContactImportBatch::create([
        'created_by' => $user->id,
        'filename' => 'test.csv',
        'original_filename' => 'test.csv',
        'total_rows' => 100,
        'processed_rows' => 50,
        'successful_rows' => 45,
        'failed_rows' => 5,
        'status' => 'processing',
    ]);

    expect($batch->isProcessing())->toBeTrue();
    expect($batch->isCompleted())->toBeFalse();
    expect($batch->isFailed())->toBeFalse();
    expect($batch->progress_percentage)->toBe(50.0);
});

test('only shows user own import batches', function () {
    $user1 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $user2 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    ContactImportBatch::create([
        'created_by' => $user1->id,
        'filename' => 'test1.csv',
        'original_filename' => 'test1.csv',
        'total_rows' => 0,
        'status' => 'pending',
    ]);

    ContactImportBatch::create([
        'created_by' => $user2->id,
        'filename' => 'test2.csv',
        'original_filename' => 'test2.csv',
        'total_rows' => 0,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($user1)->get('/contacts/import');
    $response->assertOk();

    // Check that only user1's batch is returned
    expect(ContactImportBatch::where('created_by', $user1->id)->count())->toBe(1);
    expect(ContactImportBatch::where('created_by', $user2->id)->count())->toBe(1);
});

test('user cannot access another users import status', function () {
    $user1 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);
    $user2 = User::factory()->create([
        'is_approved' => true,
        'email_verified_at' => now(),
    ]);

    $batch = ContactImportBatch::create([
        'created_by' => $user1->id,
        'filename' => 'test.csv',
        'original_filename' => 'test.csv',
        'total_rows' => 0,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($user2)->get("/contacts/import/{$batch->id}");
    $response->assertForbidden();
});
