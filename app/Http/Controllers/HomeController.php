<?php

namespace App\Http\Controllers;

use App\Enums\Package;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Render the public marketing landing page with the package catalog.
     */
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'packages' => Package::catalog(),
        ]);
    }
}
