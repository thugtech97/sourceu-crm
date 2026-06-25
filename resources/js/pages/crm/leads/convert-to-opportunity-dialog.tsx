import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    ArrowRight,
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronRight,
    Loader2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PoolContact } from './types';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const RECORD_TYPES = [
    'NDIS Accommodation',
    'Transport',
    'Labour Hire',
    'SourceU',
    'NDIS - IHS - CA - DAY',
    'NDIS Lead Advertisement',
    'DCJ / NGO ACA & CSS',
] as const;

const SALUTATIONS = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'] as const;
const BUSINESS_TYPES = ['Business', 'Client/Participant'] as const;

type Section = 'account' | 'contact' | 'opportunity';

type ConversionData = {
    contact: {
        id: number;
        salutation: string | null;
        first_name: string | null;
        middle_name: string | null;
        last_name: string | null;
        suffix: string | null;
        lead_owner: string | null;
    };
    account: {
        id: number | null;
        name: string | null;
        business_type: string | null;
    };
};

type Props = {
    contact: PoolContact;
    open: boolean;
    onClose: () => void;
    currentUserName: string;
};

// ─────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────

function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    color,
    step,
}: {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    color: string;
    step: number;
}) {
    return (
        <div className="flex items-start gap-4 mb-6">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Step {step}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {children}
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Main Dialog
// ─────────────────────────────────────────────────────────

export function ConvertToOpportunityDialog({ contact, open, onClose, currentUserName }: Props) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [activeSection, setActiveSection] = useState<Section>('account');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form state
    const [accountName, setAccountName] = useState('');
    const [accountBusinessType, setAccountBusinessType] = useState('');
    const [salutation, setSalutation] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [suffix, setSuffix] = useState('');
    const [opportunityName, setOpportunityName] = useState('');
    const [recordType, setRecordType] = useState('');
    const [recordOwner, setRecordOwner] = useState('');

    // Sync opportunity name with account name when account name changes
    // (unless user has manually edited the opportunity name)
    const [oppNameManuallyEdited, setOppNameManuallyEdited] = useState(false);

    useEffect(() => {
        if (!oppNameManuallyEdited && accountName) {
            setOpportunityName(accountName);
        }
    }, [accountName, oppNameManuallyEdited]);

    // Load pre-fill data
    useEffect(() => {
        if (!open) return;

        setLoading(true);
        setErrors({});
        setSubmitted(false);
        setActiveSection('account');
        setOppNameManuallyEdited(false);

        axios
            .get(`/leads/pool/${contact.id}/conversion-data`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })
            .then((res) => {
                const data: ConversionData = res.data;

                // Account
                setAccountName(data.account.name ?? '');
                setAccountBusinessType(data.account.business_type ?? '');

                // Contact
                setSalutation(data.contact.salutation ?? '');
                setFirstName(data.contact.first_name ?? '');
                setMiddleName(data.contact.middle_name ?? '');
                setLastName(data.contact.last_name ?? '');
                setSuffix(data.contact.suffix ?? '');

                // Opportunity defaults
                setOpportunityName(data.account.name ?? '');
                setRecordType('');
                setRecordOwner(data.contact.lead_owner || currentUserName);
            })
            .catch(() => {
                // If fetch fails, still pre-fill from the contact prop
                setAccountName(contact.account?.name ?? contact.company_name ?? '');
                setAccountBusinessType('');
                setSalutation(contact.salutation ?? '');
                setFirstName(contact.first_name ?? '');
                setMiddleName(contact.middle_name ?? '');
                setLastName(contact.last_name ?? '');
                setSuffix(contact.suffix ?? '');
                setOpportunityName(contact.account?.name ?? contact.company_name ?? '');
                setRecordType('');
                setRecordOwner(contact.lead_owner ?? currentUserName);
            })
            .finally(() => setLoading(false));
    }, [open, contact.id]);

    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        if (!accountName.trim()) newErrors.account_name = 'Account name is required.';
        if (!firstName.trim()) newErrors.first_name = 'First name is required.';
        if (!lastName.trim()) newErrors.last_name = 'Last name is required.';
        if (!opportunityName.trim()) newErrors.opportunity_name = 'Opportunity name is required.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) {
            // Jump to first section with errors
            if (errors.account_name) setActiveSection('account');
            else if (errors.first_name || errors.last_name) setActiveSection('contact');
            else setActiveSection('opportunity');
            return;
        }

        setSubmitting(true);

        try {
            const csrfToken = decodeURIComponent(
                document.cookie
                    .split('; ')
                    .find((row) => row.startsWith('XSRF-TOKEN='))
                    ?.split('=')[1] ?? '',
            );

            const response = await axios.post(
                `/leads/pool/${contact.id}/convert`,
                {
                    account_name: accountName.trim(),
                    account_business_type: accountBusinessType || null,
                    salutation: salutation || null,
                    first_name: firstName.trim(),
                    middle_name: middleName.trim() || null,
                    last_name: lastName.trim(),
                    suffix: suffix.trim() || null,
                    opportunity_name: opportunityName.trim(),
                    record_type: recordType || null,
                },
                {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': csrfToken,
                    },
                    maxRedirects: 0,
                    validateStatus: () => true,
                },
            );

            if (response.status === 302 || response.status === 200) {
                setSubmitted(true);
                // Give the user a moment to see the success state, then redirect
                setTimeout(() => {
                    router.reload({ preserveScroll: false } as any);
                    // The backend redirects to deals.edit — follow it
                    const location = response.headers['location'] ?? response.headers['x-inertia-location'];
                    if (location) {
                        router.visit(location);
                    } else {
                        // Fallback: redirect to deals index
                        router.visit('/deals');
                    }
                }, 1200);
            } else if (response.status === 422) {
                const apiErrors: Record<string, string[]> = response.data?.errors ?? {};
                const mapped: Record<string, string> = {};
                for (const [field, messages] of Object.entries(apiErrors)) {
                    mapped[field] = Array.isArray(messages) ? messages[0] : String(messages);
                }
                setErrors(mapped);
            } else {
                setErrors({ _global: response.data?.message ?? 'An unexpected error occurred.' });
            }
        } catch {
            setErrors({ _global: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        if (submitting) return;
        onClose();
    }

    const sections: { key: Section; label: string }[] = [
        { key: 'account', label: 'Account' },
        { key: 'contact', label: 'Contact' },
        { key: 'opportunity', label: 'Opportunity' },
    ];

    const sectionHasErrors = {
        account: Boolean(errors.account_name || errors.account_business_type),
        contact: Boolean(errors.first_name || errors.last_name),
        opportunity: Boolean(errors.opportunity_name),
    };

    // ── Render ──────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 gap-0 rounded-none overflow-hidden flex flex-col [&>button]:hidden">
                {/* ── Header ── */}
                <div className="border-b bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex-shrink-0 relative">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-xl p-2.5">
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-white">
                                        Convert to Opportunity
                                    </DialogTitle>
                                    <DialogDescription className="text-violet-200 text-sm mt-0.5">
                                        Review and confirm details for{' '}
                                        <strong className="text-white">
                                            {contact.first_name} {contact.last_name}
                                        </strong>
                                    </DialogDescription>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={submitting}
                                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </DialogHeader>

                    {/* Section tabs */}
                    <div className="flex gap-1 mt-5">
                        {sections.map((s, idx) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setActiveSection(s.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeSection === s.key
                                        ? 'bg-white text-violet-700 shadow-sm'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span
                                    className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                                        activeSection === s.key
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-white/20 text-white'
                                    } ${sectionHasErrors[s.key] ? '!bg-red-400' : ''}`}
                                >
                                    {idx + 1}
                                </span>
                                {s.label}
                                {sectionHasErrors[s.key] && (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto bg-muted/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                            <p className="text-sm font-medium">Loading lead data…</p>
                        </div>
                    ) : submitted ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">Conversion Successful!</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Redirecting to the new Opportunity…
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                            {/* Global error */}
                            {errors._global && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-400">{errors._global}</p>
                                </div>
                            )}

                            {/* ── ACCOUNT SECTION ── */}
                            {activeSection === 'account' && (
                                <div className="bg-card border rounded-2xl p-6 shadow-xs">
                                    <SectionHeader
                                        icon={Building2}
                                        title="Account Information"
                                        subtitle="The organisation this opportunity belongs to."
                                        color="bg-indigo-500"
                                        step={1}
                                    />
                                    <div className="space-y-5">
                                        <Field label="Account Name" required error={errors.account_name}>
                                            <Input
                                                value={accountName}
                                                onChange={(e) => setAccountName(e.target.value)}
                                                placeholder="e.g. Acme Corp"
                                                className={errors.account_name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                            />
                                        </Field>
                                        <Field label="Business Type" error={errors.account_business_type}>
                                            <Select
                                                value={accountBusinessType}
                                                onValueChange={setAccountBusinessType}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select business type…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BUSINESS_TYPES.map((bt) => (
                                                        <SelectItem key={bt} value={bt}>
                                                            {bt}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={() => setActiveSection('contact')}
                                            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                                        >
                                            Next: Contact Info
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── CONTACT SECTION ── */}
                            {activeSection === 'contact' && (
                                <div className="bg-card border rounded-2xl p-6 shadow-xs">
                                    <SectionHeader
                                        icon={User}
                                        title="Contact Information"
                                        subtitle="Review and update the contact's name details."
                                        color="bg-emerald-500"
                                        step={2}
                                    />
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Salutation">
                                                <Select value={salutation} onValueChange={setSalutation}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {SALUTATIONS.map((s) => (
                                                            <SelectItem key={s} value={s}>
                                                                {s}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                            <Field label="Suffix">
                                                <Input
                                                    value={suffix}
                                                    onChange={(e) => setSuffix(e.target.value)}
                                                    placeholder="Jr, Sr, III…"
                                                />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field label="First Name" required error={errors.first_name}>
                                                <Input
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="John"
                                                    className={errors.first_name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                                />
                                            </Field>
                                            <Field label="Middle Name">
                                                <Input
                                                    value={middleName}
                                                    onChange={(e) => setMiddleName(e.target.value)}
                                                    placeholder="Michael"
                                                />
                                            </Field>
                                            <Field label="Last Name" required error={errors.last_name}>
                                                <Input
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="Doe"
                                                    className={errors.last_name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('account')}
                                        >
                                            ← Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setActiveSection('opportunity')}
                                            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                                        >
                                            Next: Opportunity
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── OPPORTUNITY SECTION ── */}
                            {activeSection === 'opportunity' && (
                                <div className="bg-card border rounded-2xl p-6 shadow-xs">
                                    <SectionHeader
                                        icon={Briefcase}
                                        title="Opportunity Information"
                                        subtitle="Define the opportunity that will be created."
                                        color="bg-violet-500"
                                        step={3}
                                    />
                                    <div className="space-y-5">
                                        <Field
                                            label="Opportunity Name"
                                            required
                                            error={errors.opportunity_name}
                                        >
                                            <Input
                                                value={opportunityName}
                                                onChange={(e) => {
                                                    setOpportunityName(e.target.value);
                                                    setOppNameManuallyEdited(true);
                                                }}
                                                placeholder="e.g. Acme Corp — NDIS Accommodation"
                                                className={errors.opportunity_name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Defaults to the Account Name. You can customise it.
                                            </p>
                                        </Field>
                                        <Field label="Record Type">
                                            <Select value={recordType} onValueChange={setRecordType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select record type…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RECORD_TYPES.map((rt) => (
                                                        <SelectItem key={rt} value={rt}>
                                                            {rt}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Record Owner">
                                            <Input
                                                value={recordOwner}
                                                readOnly
                                                className="bg-muted cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Defaults to the Lead Owner. Owner assignment can be changed
                                                after conversion.
                                            </p>
                                        </Field>
                                    </div>
                                    <div className="mt-6 flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('contact')}
                                        >
                                            ← Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="bg-violet-600 hover:bg-violet-700 gap-2 min-w-[180px]"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Converting…
                                                </>
                                            ) : (
                                                <>
                                                    Convert to Opportunity
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── Summary strip ── */}
                            <div className="bg-card border rounded-2xl p-5 shadow-xs">
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                    Conversion Summary
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Account
                                        </p>
                                        <p className="font-medium truncate">{accountName || '—'}</p>
                                        {accountBusinessType && (
                                            <p className="text-xs text-muted-foreground">{accountBusinessType}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="w-3 h-3" /> Contact
                                        </p>
                                        <p className="font-medium">
                                            {[salutation, firstName, middleName, lastName, suffix]
                                                .filter(Boolean)
                                                .join(' ') || '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" /> Opportunity
                                        </p>
                                        <p className="font-medium truncate">{opportunityName || '—'}</p>
                                        {recordType && (
                                            <p className="text-xs text-muted-foreground">{recordType}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    Converting will create an Account, link the Contact, and create a new Opportunity at{' '}
                                    <strong className="text-foreground">New</strong> stage.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {!loading && !submitted && (
                    <div className="border-t bg-card px-6 py-4 flex-shrink-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Converting lead:</span>
                            <span className="font-semibold text-foreground">
                                {contact.first_name} {contact.last_name}
                            </span>
                            {contact.account?.name || contact.company_name ? (
                                <>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                    <span>{contact.account?.name || contact.company_name}</span>
                                </>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            {activeSection === 'opportunity' ? (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-violet-600 hover:bg-violet-700 gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Converting…
                                        </>
                                    ) : (
                                        <>
                                            Convert to Opportunity
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const order: Section[] = ['account', 'contact', 'opportunity'];
                                        const idx = order.indexOf(activeSection);
                                        if (idx < order.length - 1) setActiveSection(order[idx + 1]);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
