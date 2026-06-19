import type { DispositionOption } from './types';

export const INBOUND_DISPOSITIONS: DispositionOption[] = [
    { value: 'opportunity',       label: 'Convert to opportunity', color: 'text-green-700', needsAccountName: true },
    { value: 'meeting_booked',    label: 'Meeting booked',         color: 'text-blue-700' },
    { value: 'warm_email',        label: 'Warm email nurture',     color: 'text-orange-700' },
    { value: 'archive',           label: 'Archive',                color: 'text-amber-700', needsArchiveReason: true },
];

export const COLD_DISPOSITIONS: DispositionOption[] = [
    { value: 'handoff_to_sales',  label: 'Hand off to sales',      color: 'text-green-700' },
    { value: 'meeting_booked',    label: 'Meeting booked',         color: 'text-blue-700' },
    { value: 'warm_email',        label: 'Warm email nurture',     color: 'text-orange-700' },
    { value: 'archive',           label: 'Archive',                color: 'text-amber-700', needsArchiveReason: true },
];

export const DISPOSITION_BADGE: Record<string, string> = {
    new_lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    recycled: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

export const ARCHIVE_REASONS = [
    { value: 'not_interested', label: 'Not interested' },
    { value: 'budget_constraints', label: 'Budget constraints' },
    { value: 'already_customer', label: 'Already a customer' },
    { value: 'wrong_fit', label: 'Wrong fit for our service' },
    { value: 'competitor_user', label: 'Uses competitor' },
    { value: 'do_not_contact', label: 'Do Not Contact request' },
    { value: 'other', label: 'Other' },
];

export function timeLeft(expiresAt: string | null): { label: string; urgent: boolean } {
    if (!expiresAt) return { label: '', urgent: false };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { label: 'Expired', urgent: true };
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    return { label: `${hours}h ${minutes}m`, urgent: hours < 6 };
}

export function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export function formatDateTime(dateString: string | null, includeSeconds: boolean = true): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        year: includeSeconds ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
    });
}
