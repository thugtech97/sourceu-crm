# SourceU CRM

SourceU CRM is a simple customer relationship management app built with Laravel, Inertia, React, and Tailwind CSS. It includes authentication, a CRM dashboard, account management, contact management, deal tracking, light/dark theme switching, and SourceU branding.

## Features

- Authentication using the Laravel React starter kit
- CRM overview dashboard
- Accounts for companies and organizations
- Contacts with status, company, job title, phone, email, and notes
- Deals with stage, value, probability, close date, and notes
- Activities table ready for tasks, notes, and follow-ups
- Light/dark theme toggle saved in browser local storage
- App name pulled from `APP_NAME` / `config('app.name')`
- SourceU PNG logo and browser tab icon

## Tech Stack

- Laravel 12
- PHP 8.2+
- Inertia.js 2
- React 19
- Tailwind CSS 4
- Vite 6
- Pest PHP
- SQLite for local development by default

## Requirements

- PHP 8.2 or newer
- Composer
- Node.js and npm
- SQLite extension for local tests, or MySQL/MariaDB for database-backed deployments

On Windows/Laragon, make sure your terminal is using PHP 8.2+. This project will not run correctly on PHP 8.1.

## Local Setup

Install PHP dependencies:

```bash
composer install
```

Install frontend dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Generate the app key:

```bash
php artisan key:generate
```

If you are using SQLite locally, create the database file:

```bash
touch database/database.sqlite
```

Then update `.env`:

```env
APP_NAME="SourceU CRM"
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=sqlite
```

Run migrations and seed sample CRM data:

```bash
php artisan migrate --seed
```

Start the development servers:

```bash
composer run dev
```

Or run Laravel and Vite separately:

```bash
php artisan serve
npm run dev
```

Visit:

```txt
http://127.0.0.1:8000
```

## Default Seed User

The database seeder creates a sample user:

```txt
Email: test@example.com
```

The generated password comes from the Laravel user factory. If needed, update `database/factories/UserFactory.php` or create a user through registration.

## Useful Commands

Run frontend build:

```bash
npm run build
```

Run frontend lint:

```bash
npm run lint
```

Run frontend formatting:

```bash
npm run format
```

Run tests:

```bash
php artisan test
```

Run route list:

```bash
php artisan route:list
```

## CRM Routes

- `/crm` - CRM dashboard
- `/accounts` - account list
- `/accounts/create` - create account
- `/contacts` - contact list
- `/contacts/create` - create contact
- `/deals` - deal list
- `/deals/create` - create deal

All CRM routes require authentication.

## Production Notes

For production, update `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=sourceu_crm
DB_USERNAME=sourceu
DB_PASSWORD=change-me
```

Build frontend assets:

```bash
npm run build
```

Cache Laravel configuration:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Run migrations:

```bash
php artisan migrate --force
```

## Docker Deployment Notes

This app can be deployed cleanly on Ubuntu with Docker using:

- `nginx` for the web server
- `php-fpm` with PHP 8.2+
- `mysql` or `mariadb`
- optional `redis`

Recommended PHP extensions:

```txt
bcmath
curl
gd
intl
mbstring
pdo_mysql
pdo_sqlite
xml
zip
```

Typical Docker deployment flow:

```bash
docker compose up -d --build
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --force
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

## Branding

The app logo uses:

```txt
public/images/SourceU-tab.png
```

The browser tab icon is configured in:

```txt
resources/views/app.blade.php
```

The logo text comes from:

```txt
APP_NAME
```

## License

This project is private/internal unless you choose to publish it under a license.
