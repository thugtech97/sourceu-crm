<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\ContactImportBatch;
use App\Models\ContactImportBatchRecord;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class ProcessContactImport implements ShouldQueue
{
    use Queueable;

    protected int $batchSize = 100;

    public function __construct(
        public ContactImportBatch $batch,
    ) {}

    public function handle(): void
    {
        try {
            $this->batch->update([
                'status' => 'processing',
                'started_at' => now(),
            ]);

            $successCount = 0;
            $failedCount = 0;
            $processedCount = 0;
            $errors = [];

            // Fetch records in chunks
            $records = $this->batch->records()
                ->where('status', 'pending')
                ->orderBy('id')
                ->cursor();

            foreach ($records as $record) {
                try {
                    $this->processRecord($record);
                    $successCount++;
                } catch (\Exception $e) {
                    $record->update([
                        'status' => 'failed',
                        'error_message' => $e->getMessage(),
                    ]);
                    $failedCount++;
                    $errors[] = [
                        'row_number' => $record->row_number,
                        'error_message' => $e->getMessage(),
                        'error_reason' => $this->getErrorReason($e->getMessage()),
                        'data' => $record->data,
                    ];
                }

                $processedCount++;

                // Update progress after each batch of 100 records
                if ($processedCount % $this->batchSize === 0) {
                    $this->batch->update([
                        'processed_rows' => $processedCount,
                        'successful_rows' => $successCount,
                        'failed_rows' => $failedCount,
                    ]);
                }
            }

            // Store error log if there are failures
            if (! empty($errors)) {
                $this->storeErrorLog($errors);
            }

            $this->batch->update([
                'status' => 'completed',
                'completed_at' => now(),
                'processed_rows' => $processedCount,
                'successful_rows' => $successCount,
                'failed_rows' => $failedCount,
            ]);
        } catch (\Exception $e) {
            $this->batch->update([
                'status' => 'failed',
                'completed_at' => now(),
            ]);

            throw $e;
        }
    }

    protected function processRecord(ContactImportBatchRecord $record): void
    {
        $data = $record->data;

        // Validate required fields
        if (empty($data['first_name']) || empty($data['last_name'])) {
            throw new \Exception('First name and last name are required.');
        }

        // Check for duplicate email
        if (! empty($data['email'])) {
            $existing = Contact::where('email', $data['email'])->first();
            if ($existing) {
                $record->update(['status' => 'skipped']);
                throw new \Exception("Duplicate email — existing contact id: {$existing->id}");
            }

            // Validate email format
            if (! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new \Exception('Invalid email format.');
            }
        }

        // Validate status
        if (empty($data['status'])) {
            $data['status'] = 'lead';
        } elseif (! in_array($data['status'], ['lead', 'prospect', 'customer', 'inactive'])) {
            throw new \Exception('Invalid status value.');
        }

        // Validate source_type - default to 'import'
        $data['source_type'] = 'import';

        // Validate account_id if provided
        if (! empty($data['account_id'])) {
            $accountExists = DB::table('accounts')->where('id', $data['account_id'])->exists();
            if (! $accountExists) {
                throw new \Exception('Account ID does not exist.');
            }
        }

        // Create contact
        $contact = Contact::create([
            'owner_id' => $this->batch->created_by,
            'contact_import_batch_id' => $this->batch->id,
            'first_name' => trim($data['first_name']),
            'last_name' => trim($data['last_name']),
            'email' => ! empty($data['email']) ? trim($data['email']) : null,
            'phone' => ! empty($data['phone']) ? trim($data['phone']) : null,
            'job_title' => ! empty($data['job_title']) ? trim($data['job_title']) : null,
            'company_name' => ! empty($data['company_name']) ? trim($data['company_name']) : null,
            'status' => $data['status'],
            'notes' => ! empty($data['notes']) ? trim($data['notes']) : null,
            'source_type' => $data['source_type'],
            'account_id' => ! empty($data['account_id']) ? $data['account_id'] : null,
        ]);

        $record->update([
            'status' => 'success',
            'contact_id' => $contact->id,
        ]);
    }

    protected function storeErrorLog(array $errors): void
    {
        if (empty($errors)) {
            return;
        }

        $filename = 'contact-import-errors-'.$this->batch->id.'.csv';
        $relativePath = 'imports/'.$filename;
        $absolutePath = storage_path('app/'.$relativePath);

        // Ensure directory exists
        $directory = dirname($absolutePath);
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Build CSV with error_reason column first, then all data fields
        $headers = ['error_reason'];

        // Collect all unique field names from error data
        foreach ($errors as $error) {
            foreach (array_keys($error['data']) as $field) {
                if (! in_array($field, $headers)) {
                    $headers[] = $field;
                }
            }
        }

        // Write CSV file
        $handle = fopen($absolutePath, 'w');
        if (! $handle) {
            throw new \Exception("Failed to create error log file: {$absolutePath}");
        }

        // Write header row
        fputcsv($handle, $headers);

        // Write data rows with error reason first
        foreach ($errors as $error) {
            $row = [$error['error_reason'] ?? 'Validation error'];

            // Add all field values in order
            foreach (array_slice($headers, 1) as $field) {
                $row[] = $error['data'][$field] ?? '';
            }

            fputcsv($handle, $row);
        }

        fclose($handle);

        // Verify file was created and is readable
        if (! file_exists($absolutePath) || ! is_readable($absolutePath)) {
            throw new \Exception("Error log file could not be created or is not readable: {$absolutePath}");
        }

        // Set proper permissions
        chmod($absolutePath, 0644);

        // Update batch with relative path for Storage disk
        $this->batch->update([
            'error_log_path' => $relativePath,
        ]);
    }

    protected function getErrorReason(string $message): string
    {
        if (str_contains($message, 'Duplicate email')) {
            return 'Duplicate email';
        } elseif (str_contains($message, 'required')) {
            return 'Missing required field';
        } elseif (str_contains($message, 'email format')) {
            return 'Invalid email format';
        } elseif (str_contains($message, 'status')) {
            return 'Invalid status value';
        } elseif (str_contains($message, 'source_type')) {
            return 'Invalid source type';
        } elseif (str_contains($message, 'Account ID')) {
            return 'Invalid account ID';
        }

        return 'Validation error';
    }
}
