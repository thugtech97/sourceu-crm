<?php

namespace App\Console\Commands;

use App\Models\CallLog;
use App\Services\DialpadService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FetchDialpadTranscripts extends Command
{
    protected $signature = 'dialpad:fetch-transcripts {--call-id=} {--limit=50}';

    protected $description = 'Fetch and update transcripts and recordings from Dialpad for ended calls';

    public function __construct(private readonly DialpadService $dialpad)
    {
        parent::__construct();
    }

    public function handle()
    {
        $callId = $this->option('call-id');
        $limit = (int) $this->option('limit');

        if ($callId) {
            return $this->fetchSingleTranscript($callId);
        }

        return $this->fetchMissingTranscripts($limit);
    }

    private function fetchSingleTranscript(string $callId): int
    {
        $this->info("Fetching transcript for call ID: {$callId}");

        $callLog = CallLog::where('dialpad_call_id', $callId)->first();

        if (! $callLog) {
            $this->error("Call log not found for ID: {$callId}");

            return 1;
        }

        try {
            $transcript = $this->dialpad->getTranscript($callId);
            $recordingUrl = $this->dialpad->getRecordingUrl($callId);

            if ($transcript) {
                $callLog->update(['transcript_text' => $transcript]);
                $this->info('✓ Transcript fetched ({} characters)', strlen($transcript));
            } else {
                $this->warn('No transcript available yet');
            }

            if ($recordingUrl) {
                $callLog->update(['recording_url' => $recordingUrl]);
                $this->info('✓ Recording URL fetched');
            } else {
                $this->warn('No recording URL available');
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Error fetching transcript: {$e->getMessage()}");
            Log::error('Dialpad transcript fetch failed', ['call_id' => $callId, 'error' => $e->getMessage()]);

            return 1;
        }
    }

    private function fetchMissingTranscripts(int $limit): int
    {
        $this->info("Fetching transcripts for calls without transcripts (limit: {$limit})...\n");

        $calls = CallLog::where('status', 'ended')
            ->whereNull('transcript_text')
            ->latest()
            ->limit($limit)
            ->get();

        if ($calls->isEmpty()) {
            $this->info('No calls without transcripts found.');

            return 0;
        }

        $this->info("Found {$calls->count()} calls without transcripts.\n");

        $progressBar = $this->output->createProgressBar($calls->count());
        $progressBar->start();

        $successCount = 0;
        $failureCount = 0;

        foreach ($calls as $callLog) {
            try {
                $transcript = $this->dialpad->getTranscript($callLog->dialpad_call_id);
                $recordingUrl = $this->dialpad->getRecordingUrl($callLog->dialpad_call_id);

                if ($transcript || $recordingUrl) {
                    $callLog->update([
                        'transcript_text' => $transcript ?? $callLog->transcript_text,
                        'recording_url' => $recordingUrl ?? $callLog->recording_url,
                    ]);
                    $successCount++;
                } else {
                    $failureCount++;
                }
            } catch (\Exception $e) {
                $failureCount++;
                Log::warning('Failed to fetch transcript for call', [
                    'call_id' => $callLog->dialpad_call_id,
                    'error' => $e->getMessage(),
                ]);
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✓ Successfully fetched: {$successCount}");
        $this->info("✗ Failed or no data: {$failureCount}");

        return 0;
    }
}
