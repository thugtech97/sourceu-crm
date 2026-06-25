<?php

namespace App\Http\Controllers;

use App\Models\BusinessType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessTypeController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->string('q')->toString();

        $businessTypes = BusinessType::query()
            ->where('owner_id', $request->user()->id)
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->select('id', 'name')
            ->get();

        return response()->json($businessTypes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $businessType = BusinessType::firstOrCreate(
            ['name' => $validated['name'], 'owner_id' => $request->user()->id],
            ['owner_id' => $request->user()->id, 'name' => $validated['name']]
        );

        return response()->json($businessType);
    }
}
