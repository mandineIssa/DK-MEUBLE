<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PromoCampaignMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $campaignTitle,
        public string $subjectLine,
        public string $bodyText,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(
            htmlString: '<div style="font-family:sans-serif;line-height:1.5;color:#111">'
                .'<p style="font-size:12px;color:#888;text-transform:uppercase">DK MEUBLE</p>'
                .'<h1 style="font-size:20px;color:#FF7A00">'.e($this->campaignTitle).'</h1>'
                .'<div style="white-space:pre-line">'.e($this->bodyText).'</div>'
                .'<p style="margin-top:24px;font-size:12px;color:#888">Vous recevez cet email car vous êtes client DK MEUBLE. Répondez STOP pour vous désinscrire via votre compte.</p>'
                .'</div>'
        );
    }
}
