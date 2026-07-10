<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $invitation = $request->user()
            ->invitations()
            ->withCount('rsvps')
            ->latest()
            ->first();

        return Inertia::render('dashboard', [
            'invitation' => $invitation,
        ]);
    }
}
