<?php

namespace App\Enums;

enum Attendance: string
{
    case Hadir = 'hadir';
    case TidakHadir = 'tidak_hadir';
    case Ragu = 'ragu';
}
