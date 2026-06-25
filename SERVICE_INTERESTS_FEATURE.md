# Service Interests Feature - Complete Implementation

This document describes the complete Service Interests feature built for your CRM, which allows contacts to have their service interests tracked against configurable business units and services.

## Overview

The Service Interests feature enables:
- **Dynamic service management** organized by business units
- **Dual-listbox form interface** for selecting services
- **Admin panel** for managing business units and services
- **API endpoints** for all CRUD operations
- **Comprehensive testing** with Pest

## Database Schema

### Tables Created

#### `business_units`
```sql
- id (primary key)
- name (string, unique)
- timestamps
```

#### `services`
```sql
- id (primary key)
- business_unit_id (foreign key → business_units.id, cascade on delete)
- name (string)
- timestamps
- unique constraint on (business_unit_id, name)
```

#### `service_interest_contacts`
```sql
- id (primary key)
- contact_id (foreign key → contacts.id, cascade on delete)
- service_id (foreign key → services.id, cascade on delete)
- description (text, nullable)
- timestamps
- unique constraint on (contact_id, service_id)
```

## Models

### BusinessUnit (`app/Models/BusinessUnit.php`)
```php
- Relationship: hasMany(Service)
- Fillable: ['name']
```

### Service (`app/Models/Service.php`)
```php
- Relationship: belongsTo(BusinessUnit)
- Relationship: hasMany(ServiceInterestContact)
- Fillable: ['business_unit_id', 'name']
```

### ServiceInterestContact (`app/Models/ServiceInterestContact.php`)
```php
- Relationship: belongsTo(Contact)
- Relationship: belongsTo(Service)
- Fillable: ['contact_id', 'service_id', 'description']
```

### Contact (Updated)
- New relationship: `serviceInterests()` → hasMany(ServiceInterestContact)

## API Endpoints

### Business Units
- `GET /business-units` - List all business units (JSON)
- `POST /business-units` - Create a new business unit (JSON)
- `DELETE /business-units/{id}` - Delete a business unit
- `GET /business-units/{id}/services` - Get services for a business unit (JSON)

### Services
- `POST /services` - Create a new service (JSON)
- `DELETE /services/{id}` - Delete a service

### Service Interests
- `GET /contacts/{contact_id}/service-interests` - Get service interests for a contact
- `POST /contacts/{contact_id}/service-interests` - Save service interests (replaces existing)
- `DELETE /contacts/{contact_id}/service-interests/{service_id}` - Delete a specific interest

## Frontend Components

### 1. ServiceInterestSection (`resources/js/components/service-interest-section.tsx`)
A comprehensive form component that handles:
- Business unit selection
- Dynamic service loading based on selected business unit
- Dual-listbox interface for managing chosen vs. available services
- Arrow buttons (› and ‹) to move services between lists
- Description textarea for notes
- Error handling and loading states

**Props:**
```typescript
{
  value: {
    businessUnitId: number | null;
    chosenServiceIds: number[];
    description: string;
  };
  onChange: (value) => void;
  businessUnits: BusinessUnit[];
  error?: string;
}
```

**Usage in Contact Form:**
```tsx
import ServiceInterestSection from '@/components/service-interest-section';

// In your contact form component:
const [serviceInterests, setServiceInterests] = useState({
  businessUnitId: null,
  chosenServiceIds: [],
  description: '',
});

<ServiceInterestSection
  value={serviceInterests}
  onChange={setServiceInterests}
  businessUnits={businessUnits}
  error={errors.service_interests}
/>
```

### 2. Admin Service Settings Page (`resources/js/pages/admin/service-settings.tsx`)
A full admin interface for managing:
- List of all business units
- Add/delete business units
- Expandable units to view/manage services
- Add/delete services within each unit
- Dialog form for creating new units

**Access:** `/admin/service-settings` (admin-only)

## Controllers

### BusinessUnitController (`app/Http/Controllers/BusinessUnitController.php`)
- `index()` - List all business units with eager-loaded services
- `store(StoreBusinessUnitRequest)` - Create a new business unit
- `services(BusinessUnit)` - Get services for a specific unit
- `destroy(BusinessUnit)` - Delete a business unit

### ServiceController (`app/Http/Controllers/ServiceController.php`)
- `store(StoreServiceRequest)` - Create a new service
- `destroy(Service)` - Delete a service

### ServiceInterestController (`app/Http/Controllers/ServiceInterestController.php`)
- `index(Contact)` - Get service interests for a contact
- `store(Contact, StoreServiceInterestRequest)` - Save service interests (replaces all)
- `destroy(Contact, int)` - Delete a specific service interest

### ServiceSettingsController (`app/Http/Controllers/ServiceSettingsController.php`)
- `index()` - Render admin service settings page

## Form Requests

### StoreBusinessUnitRequest
```php
- name (required, string, unique)
```

### StoreServiceRequest
```php
- business_unit_id (required, exists in business_units)
- name (required, string)
```

### StoreServiceInterestRequest
```php
- service_ids (nullable array, each must exist in services)
- description (nullable string)
```

## Routes

All routes are registered in `routes/web.php`:

```php
// Business Units and Services API routes (authenticated users)
Route::get('business-units', [BusinessUnitController::class, 'index']);
Route::post('business-units', [BusinessUnitController::class, 'store']);
Route::delete('business-units/{businessUnit}', [BusinessUnitController::class, 'destroy']);
Route::get('business-units/{businessUnit}/services', [BusinessUnitController::class, 'services']);
Route::post('services', [ServiceController::class, 'store']);
Route::delete('services/{service}', [ServiceController::class, 'destroy']);

// Service Interests routes
Route::get('contacts/{contact}/service-interests', [ServiceInterestController::class, 'index']);
Route::post('contacts/{contact}/service-interests', [ServiceInterestController::class, 'store']);
Route::delete('contacts/{contact}/service-interests/{serviceId}', [ServiceInterestController::class, 'destroy']);

// Admin routes
Route::get('admin/service-settings', [ServiceSettingsController::class, 'index'])->name('admin.service-settings');
```

## Factories

Created for testing:
- `BusinessUnitFactory` - Generates unique business unit names
- `ServiceFactory` - Generates services with related business units
- `ServiceInterestContactFactory` - Generates service interests for contacts

## Tests

### BusinessUnitTest (`tests/Feature/BusinessUnitTest.php`)
- List all business units
- Create a business unit
- Prevent duplicate business unit names
- Get services for a business unit
- Delete a business unit
- Create a service
- Delete a service

### ServiceInterestTest (`tests/Feature/ServiceInterestTest.php`)
- Get service interests for a contact
- Store service interests for a contact
- Delete a service interest
- Replace existing service interests
- Validate service IDs exist

**Run tests:**
```bash
php artisan test --compact tests/Feature/BusinessUnitTest.php
php artisan test --compact tests/Feature/ServiceInterestTest.php
```

## Usage Example

### In Contact Create/Edit Form:

```tsx
import { useForm } from '@inertiajs/react';
import ServiceInterestSection from '@/components/service-interest-section';

export default function CreateContact({ businessUnits }) {
  const [serviceInterests, setServiceInterests] = useState({
    businessUnitId: null,
    chosenServiceIds: [],
    description: '',
  });

  const { data, setData, post, errors } = useForm({
    first_name: '',
    last_name: '',
    email: '',
    // ... other fields
    business_unit_id: serviceInterests.businessUnitId,
    chosen_service_ids: serviceInterests.chosenServiceIds,
    service_description: serviceInterests.description,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setData({
      ...data,
      business_unit_id: serviceInterests.businessUnitId,
      chosen_service_ids: serviceInterests.chosenServiceIds,
      service_description: serviceInterests.description,
    });
    post('/contacts', { onSuccess: () => router.visit('/contacts') });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... other form fields ... */}
      
      <ServiceInterestSection
        value={serviceInterests}
        onChange={setServiceInterests}
        businessUnits={businessUnits}
        error={errors.business_unit_id}
      />

      <button type="submit">Save Contact</button>
    </form>
  );
}
```

### Admin Management:

1. Navigate to `/admin/service-settings`
2. Click "Add Business Unit"
3. Enter business unit name and confirm
4. Click on a unit to expand it
5. Add services by entering a name and clicking the + button
6. Delete services by clicking the × button
7. Delete entire units with the trash icon

## Key Features

✅ **Dynamic Service Loading** - Services populate based on selected business unit
✅ **Dual-Listbox UI** - Intuitive interface for managing service selection
✅ **Admin Panel** - Full CRUD for business units and services
✅ **API-Driven** - All operations use AJAX endpoints
✅ **Validation** - Form requests ensure data integrity
✅ **Error Handling** - Graceful error messages for users
✅ **Cascade Deletes** - Deleting units/services cleans up orphaned records
✅ **Comprehensive Tests** - 12 passing tests with good coverage

## Notes

- Service interests replace all previous interests when saved (not additive)
- Business unit and service names must be unique within their scope
- All timestamps are tracked (created_at, updated_at)
- Services are ordered by name when displayed
- Business units are ordered by name in listings

## File Locations Summary

```
Database Migrations:
- database/migrations/2026_06_24_065139_create_business_units_table.php
- database/migrations/2026_06_24_065151_create_services_table.php
- database/migrations/2026_06_24_065153_create_service_interest_contacts_table.php

Models:
- app/Models/BusinessUnit.php
- app/Models/Service.php
- app/Models/ServiceInterestContact.php

Controllers:
- app/Http/Controllers/BusinessUnitController.php
- app/Http/Controllers/ServiceController.php
- app/Http/Controllers/ServiceInterestController.php
- app/Http/Controllers/ServiceSettingsController.php

Form Requests:
- app/Http/Requests/StoreBusinessUnitRequest.php
- app/Http/Requests/StoreServiceRequest.php
- app/Http/Requests/StoreServiceInterestRequest.php

React Components:
- resources/js/components/service-interest-section.tsx
- resources/js/pages/admin/service-settings.tsx

Factories:
- database/factories/BusinessUnitFactory.php
- database/factories/ServiceFactory.php
- database/factories/ServiceInterestContactFactory.php

Tests:
- tests/Feature/BusinessUnitTest.php
- tests/Feature/ServiceInterestTest.php
```
