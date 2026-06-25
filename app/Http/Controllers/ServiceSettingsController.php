<?php

namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use Inertia\Inertia;
use Inertia\Response;

class ServiceSettingsController extends Controller
{
    public function index(): Response
    {
        $businessUnits = BusinessUnit::orderBy('name')->get();

        return Inertia::render('admin/service-settings', [
            'businessUnits' => $businessUnits,
        ]);
    }
}
