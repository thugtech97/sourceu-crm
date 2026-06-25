<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBusinessUnitRequest;
use App\Models\BusinessUnit;
use Illuminate\Http\JsonResponse;

class BusinessUnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $units = BusinessUnit::with('services')->orderBy('name')->get();

        return response()->json($units);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBusinessUnitRequest $request): JsonResponse
    {
        $unit = BusinessUnit::create($request->validated());

        return response()->json($unit, 201);
    }

    /**
     * Get services for a specific business unit.
     */
    public function services(BusinessUnit $businessUnit): JsonResponse
    {
        $services = $businessUnit->services()->orderBy('name')->get();

        return response()->json($services);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BusinessUnit $businessUnit): JsonResponse
    {
        $businessUnit->delete();

        return response()->json(null, 204);
    }
}
