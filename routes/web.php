<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CrmDashboardController;
use App\Http\Controllers\DealController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('crm', CrmDashboardController::class)->name('crm.dashboard');
    Route::resource('accounts', AccountController::class)->except(['show']);
    Route::resource('contacts', ContactController::class)->except(['show']);
    Route::resource('deals', DealController::class)->except(['show']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
