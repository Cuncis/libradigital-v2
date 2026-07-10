<?php

namespace App\Enums;

enum InvitationStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}
