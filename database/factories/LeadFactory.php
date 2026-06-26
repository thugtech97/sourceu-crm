<?php

namespace Database\Factories;

use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->optional()->phoneNumber(),
            'job_title' => fake()->optional()->jobTitle(),
            'seniority_level' => fake()->optional()->randomElement(['c_suite', 'vp', 'director', 'manager', 'individual']),
            'company_name' => fake()->optional()->company(),
            'industry' => fake()->optional()->randomElement(['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing']),
            'company_size' => fake()->optional()->randomElement(['1_10', '11_50', '51_200', '201_500', '500_1000', '1000_plus']),
            'country' => fake()->optional()->country(),
            'region' => fake()->optional()->state(),
            'source_type' => fake()->randomElement(['website', 'referral', 'cold_outreach', 'linkedin', 'ad', 'event', 'partner', 'other']),
            'status' => fake()->randomElement(['new', 'contacted', 'working', 'nurturing', 'qualified']),
            'priority' => fake()->randomElement(['hot', 'warm', 'cold']),
            'touchpoint_count' => 0,
        ];
    }

    public function asNew(): static
    {
        return $this->state(['status' => 'new']);
    }

    public function qualified(): static
    {
        return $this->state([
            'status' => 'qualified',
            'bant_need' => fake()->sentence(),
            'interest_area' => fake()->words(3, true),
            'icp_score' => fake()->numberBetween(60, 100),
            'icp_tier' => fake()->randomElement(['a', 'b']),
        ]);
    }

    public function disqualified(): static
    {
        return $this->state([
            'status' => 'disqualified',
            'disqualified_reason' => fake()->randomElement(['not_a_fit', 'no_budget', 'bad_timing', 'unresponsive']),
        ]);
    }
}
