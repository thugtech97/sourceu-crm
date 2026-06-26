<?php

namespace App\Http\Controllers;

use App\Models\LeadField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadFieldController extends Controller
{
    public function index(): Response
    {
        $fields = LeadField::orderBy('sort_order')->get()->groupBy('section');

        return Inertia::render('settings/lead-fields', [
            'fieldsBySection' => $fields,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'section' => ['required', 'string', 'max:100'],
            'label' => ['required', 'string', 'max:150'],
            'key' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/', 'unique:lead_fields,key'],
            'type' => ['required', 'in:text,email,phone,url,number,currency,date,select,textarea,toggle,score'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:150'],
            'placeholder' => ['nullable', 'string', 'max:200'],
            'required' => ['boolean'],
            'show_on_list' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        LeadField::create($validated);

        return back()->with('success', 'Field created.');
    }

    public function update(Request $request, LeadField $leadField): RedirectResponse
    {
        $validated = $request->validate([
            'section' => ['required', 'string', 'max:100'],
            'label' => ['required', 'string', 'max:150'],
            'key' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/', 'unique:lead_fields,key,'.$leadField->id],
            'type' => ['required', 'in:text,email,phone,url,number,currency,date,select,textarea,toggle,score'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:150'],
            'placeholder' => ['nullable', 'string', 'max:200'],
            'required' => ['boolean'],
            'show_on_list' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $leadField->update($validated);

        return back()->with('success', 'Field updated.');
    }

    public function destroy(LeadField $leadField): RedirectResponse
    {
        $leadField->delete();

        return back()->with('success', 'Field deleted.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['uuid', 'exists:lead_fields,id'],
        ]);

        foreach ($validated['order'] as $position => $id) {
            LeadField::where('id', $id)->update(['sort_order' => $position]);
        }

        return back()->with('success', 'Order saved.');
    }
}
