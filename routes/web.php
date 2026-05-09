<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CrmDashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\DialpadController;
use App\Http\Controllers\DialpadWebhookController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::post('webhooks/dialpad', DialpadWebhookController::class)->name('webhooks.dialpad');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('crm', CrmDashboardController::class)->name('crm.dashboard');
    Route::resource('accounts', AccountController::class)->except(['show']);
    Route::post('contacts/{contact}/dialpad/dial', [DialpadController::class, 'dial'])->name('contacts.dialpad.dial');
    Route::resource('contacts', ContactController::class)->except(['show']);
    Route::post('dialpad/connect', [DialpadController::class, 'connect'])->name('dialpad.connect');
    Route::patch('deals/{deal}/meeting-outcome', [DealController::class, 'logMeetingOutcome'])->name('deals.meeting-outcome');
    Route::resource('deals', DealController::class)->except(['show']);
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
