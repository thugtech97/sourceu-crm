<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceInterestRequest;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;

class ServiceInterestController extends Controller
{
    /**
     * Get service interests for a contact with their services.
     */
    public function index(Contact $contact): JsonResponse
    {
        $interests = $contact->serviceInterests()
            ->with('service.businessUnit')
            ->get();

        return response()->json($interests);
    }

    /**
     * Store service interests for a contact.
     */
    public function store(Contact $contact, StoreServiceInterestRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $serviceIds = $validated['service_ids'] ?? [];
        $description = $validated['description'] ?? null;

        // Delete existing interests for this contact and recreate them
        $contact->serviceInterests()->delete();

        // Create new service interests
        $interests = [];
        foreach ($serviceIds as $serviceId) {
            $interests[] = $contact->serviceInterests()->create([
                'service_id' => $serviceId,
                'description' => $description,
            ]);
        }

        return response()->json($interests, 201);
    }

    /**
     * Delete a specific service interest.
     */
    public function destroy(Contact $contact, int $serviceId): JsonResponse
    {
        $contact->serviceInterests()
            ->where('service_id', $serviceId)
            ->delete();

        return response()->json(null, 204);
    }
}
