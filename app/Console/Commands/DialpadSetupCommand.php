<?php

namespace App\Console\Commands;

use App\Services\DialpadService;
use Illuminate\Console\Command;

class DialpadSetupCommand extends Command
{
    protected $signature = 'dialpad:setup {--url= : Override the webhook URL registered with Dialpad}';

    protected $description = 'Register the SourceU CRM Dialpad webhook URL.';

    public function handle(DialpadService $dialpad): int
    {
        $url = $this->option('url') ?: route('webhooks.dialpad');

        $result = $dialpad->registerWebhook($url);

        $this->info("Dialpad webhook registered: {$url}");
        $this->line(json_encode($result, JSON_PRETTY_PRINT));

        return self::SUCCESS;
    }
}
