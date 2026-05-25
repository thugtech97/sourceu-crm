<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CrmDashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\DialpadController;
use App\Http\Controllers\DialpadWebhookController;
use App\Http\Controllers\DncListController;
use App\Http\Controllers\LeadPoolController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ZapierLeadWebhookController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::post('webhooks/dialpad', DialpadWebhookController::class)->name('webhooks.dialpad');
Route::post('webhooks/zapier/leads', ZapierLeadWebhookController::class)->name('webhooks.zapier.leads');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('crm.dashboard');
    })->name('dashboard');

    Route::get('crm', CrmDashboardController::class)->name('crm.dashboard');
    Route::resource('accounts', AccountController::class)->except(['show']);
    Route::post('contacts/{contact}/dialpad/dial', [DialpadController::class, 'dial'])->name('contacts.dialpad.dial');
    Route::resource('contacts', ContactController::class)->except(['show']);
    Route::post('dialpad/connect', [DialpadController::class, 'connect'])->name('dialpad.connect');
    Route::post('dialpad/test-lookup', [DialpadController::class, 'testLookup'])->name('dialpad.test-lookup');
    Route::get('deals/kanban', [DealController::class, 'kanban'])->name('deals.kanban');
    Route::patch('deals/{deal}/stage', [DealController::class, 'updateStage'])->name('deals.stage');
    Route::patch('deals/{deal}/meeting-outcome', [DealController::class, 'logMeetingOutcome'])->name('deals.meeting-outcome');
    Route::resource('deals', DealController::class)->except(['show']);
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::get('dnc', [DncListController::class, 'index'])->name('dnc.index');
    Route::post('dnc', [DncListController::class, 'store'])->name('dnc.store');
    Route::delete('dnc/{dnc}', [DncListController::class, 'destroy'])->name('dnc.destroy');

    Route::get('leads/pool', [LeadPoolController::class, 'index'])->name('leads.pool.index');
    Route::post('leads/pool/{contact}/claim', [LeadPoolController::class, 'claim'])->name('leads.pool.claim');
    Route::patch('leads/pool/{contact}/disposition', [LeadPoolController::class, 'setDisposition'])->name('leads.pool.disposition');
    Route::patch('leads/pool/{contact}/release', [LeadPoolController::class, 'release'])->name('leads.pool.release');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
