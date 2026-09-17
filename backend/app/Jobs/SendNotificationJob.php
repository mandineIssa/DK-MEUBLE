<?php

namespace App\Jobs;

use App\Models\AppNotification;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendNotificationJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  list<string>  $channels
     * @param  array<string, mixed>  $vars
     */
    public function __construct(
        public int $notificationId,
        public array $channels,
        public array $vars = [],
    ) {
    }

    public function handle(NotificationService $notifications): void
    {
        $notification = AppNotification::query()->find($this->notificationId);
        if (! $notification) {
            return;
        }

        $notifications->deliver($notification, $this->channels, $this->vars);
    }
}
