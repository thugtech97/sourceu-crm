<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\UserApprovalController;
use App\Http\Controllers\Auth\PendingApprovalController;
use App\Http\Controllers\BusinessTypeController;
use App\Http\Controllers\BusinessUnitController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContactImportController;
use App\Http\Controllers\CrmDashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\DialpadController;
use App\Http\Controllers\DialpadTestController;
use App\Http\Controllers\DialpadWebhookController;
use App\Http\Controllers\DncListController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadImportController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceInterestController;
use App\Http\Controllers\ServiceSettingsController;
use App\Http\Controllers\ZapierLeadWebhookController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::post('webhooks/dialpad', DialpadWebhookController::class)->name('webhooks.dialpad');
Route::post('webhooks/zapier/leads', ZapierLeadWebhookController::class)->name('webhooks.zapier.leads');

// Verified users waiting for admin approval.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('pending-approval', PendingApprovalController::class)->name('pending-approval');
});

// Fully authenticated, verified, and admin-approved users.
Route::middleware(['auth', 'verified', 'approved'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('crm.dashboard');
    })->name('dashboard');

    Route::get('crm', CrmDashboardController::class)->name('crm.dashboard');
    Route::get('accounts/search', [AccountController::class, 'search'])->name('accounts.search');
    Route::resource('accounts', AccountController::class);
    Route::get('industries/search', [IndustryController::class, 'search'])->name('industries.search');
    Route::post('industries', [IndustryController::class, 'store'])->name('industries.store');
    Route::get('roles/search', [RoleController::class, 'search'])->name('roles.search');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::get('business-types/search', [BusinessTypeController::class, 'search'])->name('business-types.search');
    Route::post('business-types', [BusinessTypeController::class, 'store'])->name('business-types.store');
    Route::get('lead-sources/search', [LeadSourceController::class, 'search'])->name('lead-sources.search');
    Route::post('lead-sources', [LeadSourceController::class, 'store'])->name('lead-sources.store');

    // Business Units and Services API routes
    Route::get('business-units', [BusinessUnitController::class, 'index'])->name('business-units.index');
    Route::post('business-units', [BusinessUnitController::class, 'store'])->name('business-units.store');
    Route::delete('business-units/{businessUnit}', [BusinessUnitController::class, 'destroy'])->name('business-units.destroy');
    Route::get('business-units/{businessUnit}/services', [BusinessUnitController::class, 'services'])->name('business-units.services');
    Route::post('services', [ServiceController::class, 'store'])->name('services.store');
    Route::delete('services/{service}', [ServiceController::class, 'destroy'])->name('services.destroy');

    // Service Interests routes
    Route::get('contacts/{contact}/service-interests', [ServiceInterestController::class, 'index'])->name('service-interests.index');
    Route::post('contacts/{contact}/service-interests', [ServiceInterestController::class, 'store'])->name('service-interests.store');
    Route::delete('contacts/{contact}/service-interests/{serviceId}', [ServiceInterestController::class, 'destroy'])->name('service-interests.destroy');

    Route::post('contacts/{contact}/dialpad/dial', [DialpadController::class, 'dial'])->name('contacts.dialpad.dial');
    Route::get('contacts/{contact}/dialpad/transcripts', [DialpadController::class, 'getCallTranscripts'])->name('contacts.dialpad.transcripts');
    Route::resource('contacts', ContactController::class)->except(['show']);

    // Contact import routes
    Route::get('contacts/import', [ContactImportController::class, 'index'])->name('contacts.import.index');
    Route::post('contacts/import/upload', [ContactImportController::class, 'upload'])->name('contacts.import.upload');
    Route::get('contacts/import/mapping', [ContactImportController::class, 'mapping'])->name('contacts.import.mapping');
    Route::post('contacts/import/confirm', [ContactImportController::class, 'confirm'])->name('contacts.import.confirm');
    Route::get('contacts/import-template/csv', [ContactImportController::class, 'downloadTemplate'])->name('contacts.import-template.csv');
    Route::get('contacts/import-template/xlsx', [ContactImportController::class, 'downloadExcelTemplate'])->name('contacts.import-template.xlsx');
    // More specific routes BEFORE the generic {batch} route
    Route::get('contacts/import/{batch}/status', [ContactImportController::class, 'getStatus'])->name('contacts.import.get-status');
    Route::get('contacts/import/{batch}/download-errors', [ContactImportController::class, 'downloadErrorLog'])->name('contacts.import.download-errors');
    Route::get('contacts/import/{batch}', [ContactImportController::class, 'status'])->name('contacts.import.status');
    Route::get('contacts/{contact}', [ContactController::class, 'show'])->name('contacts.show');

    Route::post('dialpad/connect', [DialpadController::class, 'connect'])->name('dialpad.connect');
    Route::post('dialpad/test-lookup', [DialpadController::class, 'testLookup'])->name('dialpad.test-lookup');

    // Dialpad testing & debugging routes
    Route::prefix('dialpad/test')->name('dialpad.test.')->group(function () {
        Route::get('dashboard', [DialpadTestController::class, 'dashboard'])->name('dashboard');
        Route::get('status', [DialpadTestController::class, 'status'])->name('status');
        Route::match(['get', 'post'], 'connection', [DialpadTestController::class, 'testConnection'])->name('connection');
        Route::match(['get', 'post'], 'user-lookup', [DialpadTestController::class, 'testUserLookup'])->name('user-lookup');
        Route::match(['get', 'post'], 'webhook-secret', [DialpadTestController::class, 'testWebhookSecret'])->name('webhook-secret');
        Route::match(['get', 'post'], 'simulate-webhook', [DialpadTestController::class, 'simulateWebhookEvent'])->name('simulate-webhook');
        Route::get('call-logs', [DialpadTestController::class, 'getCallLogs'])->name('call-logs');
        Route::get('webhook-logs', [DialpadTestController::class, 'getWebhookLogs'])->name('webhook-logs');
        Route::post('clear-test-data', [DialpadTestController::class, 'clearTestData'])->name('clear-test-data');
        Route::get('export-calls', [DialpadTestController::class, 'exportCallLogs'])->name('export-calls');
        Route::post('fetch-transcript', [DialpadTestController::class, 'fetchCallTranscript'])->name('fetch-transcript');
        Route::get('calls-without-transcripts', [DialpadTestController::class, 'getCallsWithoutTranscripts'])->name('calls-without-transcripts');
    });

    Route::get('deals/kanban', [DealController::class, 'kanban'])->name('deals.kanban');
    Route::patch('deals/{deal}/stage', [DealController::class, 'updateStage'])->name('deals.stage');
    Route::patch('deals/{deal}/meeting-outcome', [DealController::class, 'logMeetingOutcome'])->name('deals.meeting-outcome');
    Route::resource('deals', DealController::class)->except(['show']);
    Route::get('deals/{deal}', [DealController::class, 'show'])->name('deals.show');
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    Route::get('dnc', [DncListController::class, 'index'])->name('dnc.index');
    Route::post('dnc', [DncListController::class, 'store'])->name('dnc.store');
    Route::delete('dnc/{dnc}', [DncListController::class, 'destroy'])->name('dnc.destroy');

    // Lead import routes
    Route::get('leads/import', [LeadImportController::class, 'index'])->name('leads.import.index');
    Route::post('leads/import/upload', [LeadImportController::class, 'upload'])->name('leads.import.upload');
    Route::get('leads/import/mapping', [LeadImportController::class, 'mapping'])->name('leads.import.mapping');
    Route::post('leads/import/confirm', [LeadImportController::class, 'confirm'])->name('leads.import.confirm');
    Route::get('leads/import-template/csv', [LeadImportController::class, 'downloadTemplate'])->name('leads.import-template.csv');
    Route::get('leads/import-template/xlsx', [LeadImportController::class, 'downloadExcelTemplate'])->name('leads.import-template.xlsx');
    // More specific routes BEFORE the generic {batch} route
    Route::get('leads/import/{batch}/status', [LeadImportController::class, 'getStatus'])->name('leads.import.get-status');
    Route::get('leads/import/{batch}/download-errors', [LeadImportController::class, 'downloadErrorLog'])->name('leads.import.download-errors');
    Route::get('leads/import/{batch}', [LeadImportController::class, 'status'])->name('leads.import.status');

    // Lead actions — must be before the resource route
    Route::post('leads/{lead}/convert', [LeadController::class, 'convert'])->name('leads.convert');
    Route::post('leads/{lead}/disqualify', [LeadController::class, 'disqualify'])->name('leads.disqualify');

    // Spec-compliant Lead CRUD — pool/import routes above take precedence for their specific paths
    Route::resource('leads', LeadController::class);
});

// Admin panel — approved admins only.
Route::middleware(['auth', 'verified', 'approved', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('users', [UserApprovalController::class, 'index'])->name('users.index');
        Route::patch('users/{user}/approve', [UserApprovalController::class, 'approve'])->name('users.approve');
        Route::delete('users/{user}', [UserApprovalController::class, 'destroy'])->name('users.destroy');
        Route::get('audit-log', AuditLogController::class)->name('audit-log');
        Route::get('service-settings', [ServiceSettingsController::class, 'index'])->name('service-settings');
    });

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
