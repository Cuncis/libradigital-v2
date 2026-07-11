<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\InvitationController as AdminInvitationController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PublicInvitationController;
use App\Http\Controllers\RsvpController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\VisitorController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::middleware('guest')->group(function () {
    Route::get('auth/google/redirect', [GoogleController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::post('invitations', [InvitationController::class, 'store'])->name('invitations.store');
    Route::get('invitations/{invitation:id}/edit', [InvitationController::class, 'edit'])->name('invitations.edit');
    Route::put('invitations/{invitation:id}', [InvitationController::class, 'update'])->name('invitations.update');
    Route::post('invitations/{invitation:id}/photos', [InvitationController::class, 'uploadPhotos'])->name('invitations.photos.store');
    Route::post('invitations/{invitation:id}/cover', [InvitationController::class, 'uploadCover'])->name('invitations.cover.store');
    Route::delete('invitations/{invitation:id}/photos/{photo}', [InvitationController::class, 'deletePhoto'])->name('invitations.photos.destroy');
    Route::put('invitations/{invitation:id}/gifts', [InvitationController::class, 'syncGifts'])->name('invitations.gifts.update');

    Route::get('invitations/{invitation:id}/rsvps', [RsvpController::class, 'index'])->name('invitations.rsvps.index');
    Route::get('invitations/{invitation:id}/rsvps/export', [RsvpController::class, 'export'])->name('invitations.rsvps.export');

    Route::post('invitations/{invitation:id}/orders', [OrderController::class, 'store'])->name('invitations.orders.store');
});

// Superadmin panel (is_admin only).
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');

    Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
    Route::patch('users/{user}/admin', [AdminUserController::class, 'toggleAdmin'])->name('users.admin.toggle');

    Route::get('invitations', [AdminInvitationController::class, 'index'])->name('invitations.index');
    Route::patch('invitations/{invitation:id}', [AdminInvitationController::class, 'update'])->name('invitations.update');

    Route::get('orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::patch('orders/{order}/refund', [AdminOrderController::class, 'refund'])->name('orders.refund');
});

// Midtrans server-to-server transaction notification (signature-verified, no session/CSRF).
Route::post('billing/webhook', [OrderController::class, 'webhook'])->name('billing.webhook');

// Public invitation page (published only) — see Step 4 for OG meta + SSR.
Route::get('undangan/{slug}', [PublicInvitationController::class, 'show'])->name('invitation.show');
Route::post('undangan/{slug}/rsvp', [RsvpController::class, 'store'])->middleware('throttle:5,1')->name('invitation.rsvp.store');
Route::post('undangan/{slug}/visit', [VisitorController::class, 'store'])->middleware('throttle:30,1')->name('invitation.visit');
Route::get('undangan/{slug}/visitors', [VisitorController::class, 'count'])->middleware('throttle:60,1')->name('invitation.visitors');

// Templates listing (used by the builder's template selector).
Route::get('templates', [TemplateController::class, 'index'])->name('templates.index');

require __DIR__.'/settings.php';
