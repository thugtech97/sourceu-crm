<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Service;
use App\Models\ServiceInterestContact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceInterestContact>
 */
class ServiceInterestContactFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contact_id' => Contact::factory(),
            'service_id' => Service::factory(),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
