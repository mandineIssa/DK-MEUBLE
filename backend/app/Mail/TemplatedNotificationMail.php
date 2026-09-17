<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TemplatedNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $mailSubject,
        public string $mailBody,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        return new Content(
            htmlString: nl2br(e($this->mailBody)).'<p style="margin-top:24px;font-size:12px;color:#888">DK MEUBLE — <a href="'.e(config('app.frontend_url', config('app.url'))).'/compte/notifications/preferences">Gérer mes alertes</a></p>',
        );
    }
}
