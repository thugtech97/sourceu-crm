<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:leads,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'linkedin_url' => ['nullable', 'url', 'max:500'],
            'job_title' => ['nullable', 'string', 'max:150'],
            'seniority_level' => ['nullable', Rule::in(['c_suite', 'vp', 'director', 'manager', 'individual'])],
            'company_name' => ['nullable', 'string', 'max:200'],
            'industry' => ['nullable', 'string', 'max:100'],
            'company_size' => ['nullable', Rule::in(['1_10', '11_50', '51_200', '201_500', '500_1000', '1000_plus'])],
            'annual_revenue' => ['nullable', Rule::in(['under_1m', '1m_5m', '5m_10m', '10m_50m', '50m_100m', '100m_500m', '500m_plus'])],
            'company_website' => ['nullable', 'url', 'max:500'],
            'country' => ['nullable', 'string', 'max:100'],
            'region' => ['nullable', 'string', 'max:100'],
            'source_type' => ['required', Rule::in(['website', 'referral', 'cold_outreach', 'linkedin', 'ad', 'event', 'partner', 'api', 'import', 'other'])],
            'source_campaign' => ['nullable', 'string', 'max:200'],
            'source_url' => ['nullable', 'url', 'max:500'],
            'status' => ['required', Rule::in(['new', 'contacted', 'working', 'nurturing', 'qualified', 'disqualified', 'converted'])],
            'priority' => ['required', Rule::in(['hot', 'warm', 'cold'])],
            'disqualified_reason' => ['nullable', Rule::in(['not_a_fit', 'no_budget', 'no_authority', 'bad_timing', 'competitor_chosen', 'unresponsive', 'other'])],
            'bant_budget' => ['nullable', Rule::in(['confirmed', 'likely', 'unknown', 'none'])],
            'bant_budget_amount' => ['nullable', 'numeric', 'min:0'],
            'bant_authority' => ['nullable', Rule::in(['decision_maker', 'influencer', 'champion', 'unknown'])],
            'bant_need' => ['nullable', 'string'],
            'bant_need_score' => ['nullable', Rule::in(['strong', 'moderate', 'low', 'none'])],
            'bant_timeline' => ['nullable', Rule::in(['immediate', 'short', 'medium', 'long', 'unknown'])],
            'interest_area' => ['nullable', 'string', 'max:500'],
            'pain_points' => ['nullable', 'string'],
            'initial_notes' => ['nullable', 'string'],
            'competitor_mention' => ['nullable', 'string', 'max:200'],
            'assigned_to' => ['nullable', Rule::exists('users', 'id')],
            'follow_up_due_at' => ['nullable', 'date'],
        ];
    }
}
