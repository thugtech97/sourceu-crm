<?php

namespace App\Http\Controllers;

use App\Models\LeadSource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LeadSourceController extends Controller
{
    public function search(Request $request): Response
    {
        $query = $request->string('q', '')->trim();

        if ($query === '') {
            return response(['error' => 'No query provided'], 400);
        }

        $leadSources = LeadSource::query()
            ->where('owner_id', $request->user()->id)
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->select('id', 'name')
            ->get();

        return response($leadSources);
    }

    public function store(Request $request): Response
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $leadSource = LeadSource::firstOrCreate(
            ['name' => $validated['name'], 'owner_id' => $request->user()->id],
        );

        return response($leadSource, 201);
    }
}
