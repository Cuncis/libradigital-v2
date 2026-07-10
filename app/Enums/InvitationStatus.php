<?php

namespace App\Enums;

enum InvitationStatus: string
{
    case Draft = 'draft';
    case PendingPayment = 'pending_payment';
    case Active = 'active';
    case Expired = 'expired';
}
