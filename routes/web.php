<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\PublicInvitationController;
use App\Http\Controllers\RsvpController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\VisitorController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function () {
    Route::get('auth/google/redirect', [GoogleController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::post('invitations', [InvitationController::class, 'store'])->name('invitations.store');
    Route::get('invitations/{invitation:id}/edit', [InvitationController::class, 'edit'])->name('invitations.edit');
    Route::put('invitations/{invitation:id}', [InvitationController::class, 'update'])->name('invitations.update');
    Route::post('invitations/{invitation:id}/publish', [InvitationController::class, 'publish'])->name('invitations.publish');
    Route::post('invitations/{invitation:id}/unpublish', [InvitationController::class, 'unpublish'])->name('invitations.unpublish');
    Route::post('invitations/{invitation:id}/photos', [InvitationController::class, 'uploadPhotos'])->name('invitations.photos.store');
    Route::post('invitations/{invitation:id}/cover', [InvitationController::class, 'uploadCover'])->name('invitations.cover.store');
    Route::delete('invitations/{invitation:id}/photos/{photo}', [InvitationController::class, 'deletePhoto'])->name('invitations.photos.destroy');
    Route::put('invitations/{invitation:id}/gifts', [InvitationController::class, 'syncGifts'])->name('invitations.gifts.update');

    Route::get('invitations/{invitation:id}/rsvps', [RsvpController::class, 'index'])->name('invitations.rsvps.index');
    Route::get('invitations/{invitation:id}/rsvps/export', [RsvpController::class, 'export'])->name('invitations.rsvps.export');
});

// Public invitation page (published only) — see Step 4 for OG meta + SSR.
Route::get('undangan/{slug}', [PublicInvitationController::class, 'show'])->name('invitation.show');
Route::post('undangan/{slug}/rsvp', [RsvpController::class, 'store'])->middleware('throttle:5,1')->name('invitation.rsvp.store');
Route::post('undangan/{slug}/visit', [VisitorController::class, 'store'])->middleware('throttle:30,1')->name('invitation.visit');
Route::get('undangan/{slug}/visitors', [VisitorController::class, 'count'])->middleware('throttle:60,1')->name('invitation.visitors');

// Templates listing (used by the builder's template selector).
Route::get('templates', [TemplateController::class, 'index'])->name('templates.index');

require __DIR__.'/settings.php';
