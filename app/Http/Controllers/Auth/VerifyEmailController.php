<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            if ($request->user()->is_approved) {
                return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
            }

            return redirect()->route('pending-approval');
        }

        if ($request->user()->markEmailAsVerified()) {
            /** @var MustVerifyEmail $user */
            $user = $request->user();

            event(new Verified($user));
        }

        // Send to dashboard if already approved (e.g. existing admin), otherwise pending-approval.
        if ($request->user()->is_approved) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        return redirect()->route('pending-approval');
    }
}
