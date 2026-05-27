<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\UserApprovedNotification;
use Illuminate\Console\Command;

class ApproveUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:approve
                            {email : The email address of the user to approve}
                            {--admin : Also grant admin privileges}';

    protected $description = 'Approve a pending user account, optionally granting admin access';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error("No user found with email: {$this->argument('email')}");

            return self::FAILURE;
        }

        $updates = ['is_approved' => true];

        if ($this->option('admin')) {
            $updates['is_admin'] = true;
        }

        $user->update($updates);

        if (! $this->option('admin')) {
            $user->notify(new UserApprovedNotification);
        }

        $adminNote = $this->option('admin') ? ' (admin)' : '';
        $this->info("✓ {$user->name} ({$user->email}) approved{$adminNote}.");

        return self::SUCCESS;
    }
}
