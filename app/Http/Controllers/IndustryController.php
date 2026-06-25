<?php

namespace App\Http\Controllers;

use App\Models\Industry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IndustryController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->string('q')->toString();

        $industries = Industry::query()
            ->where('owner_id', $request->user()->id)
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->select('id', 'name')
            ->get();

        return response()->json($industries);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $industry = Industry::firstOrCreate(
            ['name' => $validated['name'], 'owner_id' => $request->user()->id],
            ['owner_id' => $request->user()->id, 'name' => $validated['name']]
        );

        return response()->json($industry);
    }
}
