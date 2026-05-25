<?php

namespace App\Notifications;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LeadExpiredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Contact $contact) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => "Your lead {$this->contact->name} was not converted within 72 hours and has been returned to the pool.",
            'contact_id' => $this->contact->id,
            'contact_name' => $this->contact->name,
        ];
    }
}
