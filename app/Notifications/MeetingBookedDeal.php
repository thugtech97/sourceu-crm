<?php

namespace App\Notifications;

use App\Models\Deal;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MeetingBookedDeal extends Notification
{
    use Queueable;

    public function __construct(private readonly Deal $deal) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'deal_id' => $this->deal->id,
            'deal_name' => $this->deal->name,
            'stage' => $this->deal->stage,
            'message' => "Meeting booked for {$this->deal->name}.",
            'url' => route('deals.edit', $this->deal),
        ];
    }
}
