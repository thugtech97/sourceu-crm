<?php

namespace Database\Factories;

use App\Models\LeadField;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadField>
 */
class LeadFieldFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $label = $this->faker->unique()->words(2, true);

        return [
            'section' => $this->faker->randomElement(['qualification', 'general', 'company', 'contact']),
            'label' => ucfirst($label),
            'key' => str_replace(' ', '_', strtolower($label)),
            'type' => $this->faker->randomElement(['text', 'number', 'date', 'select', 'textarea', 'toggle']),
            'options' => null,
            'placeholder' => null,
            'required' => false,
            'show_on_list' => false,
            'sort_order' => $this->faker->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
