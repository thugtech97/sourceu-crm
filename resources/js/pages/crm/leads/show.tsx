import { type LeadFieldDef } from '@/components/leads/custom-field-renderer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart2,
    BriefcaseBusiness,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Globe,
    Link2,
    Mail,
    Pencil,
    Phone,
    User,
    UserCircle,
    XCircle,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConvertedContact = { id: number; first_name: string; last_name: string; email: string | null; phone: string | null; job_title: string | null };
type ConvertedAccount = { id: number; name: string; industry: string | null; website: string | null };
type ConvertedOpportunity = { id: number; name: string; stage: string; value: string };

type Lead = {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    linkedin_url: string | null;
    job_title: string | null;
    seniority_level: string | null;
    company_name: string | null;
    industry: string | null;
    company_size: string | null;
    annual_revenue: string | null;
    company_website: string | null;
    country: string | null;
    region: string | null;
    source_type: string;
    source_campaign: string | null;
    source_url: string | null;
    status: string;
    priority: string;
    disqualified_reason: string | null;
    icp_score: number | null;
    icp_tier: string | null;
    bant_budget: string | null;
    bant_budget_amount: string | null;
    bant_authority: string | null;
    bant_need: string | null;
    bant_need_score: string | null;
    bant_timeline: string | null;
    interest_area: string | null;
    pain_points: string | null;
    initial_notes: string | null;
    competitor_mention: string | null;
    touchpoint_count: number;
    follow_up_due_at: string | null;
    first_contacted_at: string | null;
    last_activity_at: string | null;
    converted_at: string | null;
    created_at: string;
    assigned_to?: { id: number; name: string } | null;
    created_by?: { id: number; name: string } | null;
    field_values?: { lead_field_id: string; value: string | null; field: LeadFieldDef }[];
    converted_contact?: ConvertedContact | null;
    converted_account?: ConvertedAccount | null;
    converted_opportunity?: ConvertedOpportunity | null;
};

type Props = { lead: Lead; customFields: LeadFieldDef[] };
type Tab = 'overview' | 'bant' | 'activity' | 'custom_fields';

// ─── ICP criteria (same logic as create.tsx) ──────────────────────────────

const ICP_CRITERIA: { key: string; label: string; points: number; check: (l: Lead) => boolean }[] = [
    { key: 'industry', label: 'Industry match', points: 20, check: (l) => ['technology', 'software', 'saas', 'healthcare', 'finance', 'financial_services', 'professional_services'].includes(l.industry ?? '') },
    { key: 'company_size', label: 'Company size 51–200', points: 20, check: (l) => ['51_200', '201_500'].includes(l.company_size ?? '') },
    { key: 'seniority', label: 'Director seniority', points: 15, check: (l) => ['c_suite', 'vp', 'director'].includes(l.seniority_level ?? '') },
    { key: 'country', label: 'Country AU / NZ', points: 10, check: (l) => { const v = (l.country ?? '').toLowerCase(); return v === 'australia' || v === 'new zealand' || v === 'au' || v === 'nz'; } },
    { key: 'revenue_5m', label: 'Revenue $5M+', points: 15, check: (l) => ['5m_10m', '10m_50m', '50m_100m', '100m_500m', '500m_plus'].includes(l.annual_revenue ?? '') },
    { key: 'job_title', label: 'Job title keywords', points: 10, check: (l) => ['head', 'chief', 'ceo', 'cto', 'coo', 'cfo', 'vp', 'president', 'founder', 'director'].some((k) => (l.job_title ?? '').toLowerCase().includes(k)) },
    { key: 'revenue_bracket', label: 'Annual revenue bracket', points: 10, check: (l) => ['10m_50m', '50m_100m', '100m_500m', '500m_plus'].includes(l.annual_revenue ?? '') },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(d: string | null): string {
    if (!d) return '—';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function leadAge(d: string | null): string {
    if (!d) return '—';
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return days === 1 ? '1 day' : `${days} days`;
}

function initials(name: string): string {
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function humanize(s: string | null, sep: string | RegExp = /_/g): string {
    if (!s) return '—';
    return s.replace(sep, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function revenueLabel(v: string | null): string {
    const map: Record<string, string> = {
        under_1m: 'Under $1M', '1m_5m': '$1M–$5M', '5m_10m': '$5M–$10M',
        '10m_50m': '$10M–$50M', '50m_100m': '$50M–$100M', '100m_500m': '$100M–$500M', '500m_plus': '$500M+',
    };
    return v ? (map[v] ?? humanize(v)) : '—';
}

function companySizeLabel(v: string | null): string {
    if (!v) return '—';
    return v.replace(/_/g, '–') + ' employees';
}

const STATUS_DOT: Record<string, string> = {
    new: 'bg-sky-400', contacted: 'bg-blue-400', working: 'bg-amber-400',
    nurturing: 'bg-purple-400', qualified: 'bg-green-400', disqualified: 'bg-red-400', converted: 'bg-slate-400',
};
const PRIORITY_DOT: Record<string, string> = { hot: 'bg-red-400', warm: 'bg-orange-400', cold: 'bg-slate-400' };

const TIER_COLOR: Record<string, string> = { a: 'text-green-400', b: 'text-blue-400', c: 'text-amber-400', d: 'text-red-400' };
const TIER_RING: Record<string, string> = { a: 'ring-green-500', b: 'ring-blue-500', c: 'ring-amber-500', d: 'ring-red-500' };
const TIER_BG: Record<string, string> = {
    a: 'bg-green-500/20 text-green-400 ring-1 ring-green-500',
    b: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500',
    c: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500',
    d: 'bg-red-500/20 text-red-400 ring-1 ring-red-500',
};

function DL({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-zinc-100">{value ?? <span className="text-zinc-600">—</span>}</dd>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ShowLead({ lead, customFields }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/leads' },
        { title: lead.name, href: `/leads/${lead.id}` },
    ];

    const [tab, setTab] = useState<Tab>('overview');
    const [showDisqualifyDialog, setShowDisqualifyDialog] = useState(false);
    const [showConvertDialog, setShowConvertDialog] = useState(false);
    const [converting, setConverting] = useState(false);

    const disqualifyForm = useForm({ reason: '' });

    const icp = useMemo(() => {
        const criteria = ICP_CRITERIA.map((c) => ({ ...c, met: c.check(lead) }));
        const score = lead.icp_score ?? Math.min(100, criteria.reduce((s, c) => s + (c.met ? c.points : 0), 0));
        const tier = lead.icp_tier ?? (score >= 76 ? 'a' : score >= 51 ? 'b' : score >= 26 ? 'c' : 'd');
        return { score, tier, criteria };
    }, [lead]);

    function disqualify() {
        disqualifyForm.post(`/leads/${lead.id}/disqualify`, {
            onSuccess: () => setShowDisqualifyDialog(false),
        });
    }

    function convertToOpportunity() {
        setConverting(true);
        router.post(`/leads/${lead.id}/convert`, {}, {
            onSuccess: () => setShowConvertDialog(false),
            onFinish: () => setConverting(false),
        });
    }

    const isConverted = lead.status === 'converted';
    const isDisqualified = lead.status === 'disqualified';

    const TABS: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'bant', label: 'BANT' },
        { key: 'activity', label: 'Activity' },
        { key: 'custom_fields', label: 'Custom Fields' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={lead.name} />

            <div className="flex flex-1 flex-col">
                {/* ── Action bar ── */}
                <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
                    <span className="text-muted-foreground text-sm">Lead profile</span>
                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                            <Link href={`/leads/${lead.id}/edit`}>
                                <Pencil className="size-3.5" />
                                Edit
                            </Link>
                        </Button>
                        {isConverted ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                                <CheckCircle2 className="size-3.5" />
                                Converted
                            </span>
                        ) : (
                            <Button
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => setShowConvertDialog(true)}
                                disabled={isDisqualified}
                            >
                                <Zap className="size-3.5" />
                                Convert to Opportunity
                            </Button>
                        )}
                        {!isConverted && !isDisqualified && (
                            <button
                                type="button"
                                className="text-sm text-red-500 hover:underline"
                                onClick={() => setShowDisqualifyDialog(true)}
                            >
                                Disqualify
                            </button>
                        )}
                        {isDisqualified && (
                            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
                                <XCircle className="size-3.5" />
                                Disqualified
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Converted banner ── */}
                {isConverted && (
                    <div className="border-b border-emerald-900/40 bg-emerald-950/40 px-6 py-4">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-3 flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-emerald-400" />
                                <p className="text-sm font-semibold text-emerald-400">Converted to opportunity</p>
                                {lead.converted_at && (
                                    <span className="text-xs text-zinc-500">· {formatDate(lead.converted_at)}</span>
                                )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {lead.converted_contact && (
                                    <Link
                                        href={`/contacts/${lead.converted_contact.id}/edit`}
                                        className="group flex items-center gap-3 rounded-xl border border-emerald-900/40 bg-zinc-900/60 p-3 transition-colors hover:border-emerald-700/50 hover:bg-zinc-800/60"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-400">
                                            <UserCircle className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Contact</p>
                                            <p className="mt-0.5 truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                                                {lead.converted_contact.first_name} {lead.converted_contact.last_name}
                                            </p>
                                            <p className="truncate text-xs text-zinc-500">
                                                {lead.converted_contact.job_title ?? lead.converted_contact.email ?? '—'}
                                            </p>
                                        </div>
                                        <ArrowRight className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-emerald-400" />
                                    </Link>
                                )}
                                {lead.converted_account && (
                                    <Link
                                        href={`/accounts/${lead.converted_account.id}/edit`}
                                        className="group flex items-center gap-3 rounded-xl border border-emerald-900/40 bg-zinc-900/60 p-3 transition-colors hover:border-emerald-700/50 hover:bg-zinc-800/60"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                                            <Building2 className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Account</p>
                                            <p className="mt-0.5 truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                                                {lead.converted_account.name}
                                            </p>
                                            <p className="truncate text-xs text-zinc-500">
                                                {lead.converted_account.industry ? humanize(lead.converted_account.industry) : 'No industry'}
                                            </p>
                                        </div>
                                        <ArrowRight className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-emerald-400" />
                                    </Link>
                                )}
                                {lead.converted_opportunity && (
                                    <Link
                                        href={`/deals/${lead.converted_opportunity.id}/edit`}
                                        className="group flex items-center gap-3 rounded-xl border border-emerald-900/40 bg-zinc-900/60 p-3 transition-colors hover:border-emerald-700/50 hover:bg-zinc-800/60"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
                                            <BriefcaseBusiness className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Opportunity</p>
                                            <p className="mt-0.5 truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                                                {lead.converted_opportunity.name}
                                            </p>
                                            <p className="truncate text-xs text-zinc-500">
                                                Stage: {humanize(lead.converted_opportunity.stage)}
                                            </p>
                                        </div>
                                        <ArrowRight className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-emerald-400" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Disqualified banner ── */}
                {isDisqualified && (
                    <div className="border-b border-red-900/40 bg-red-950/30 px-6 py-3">
                        <div className="mx-auto max-w-7xl flex items-center gap-3">
                            <XCircle className="size-4 shrink-0 text-red-400" />
                            <span className="text-sm font-semibold text-red-400">Disqualified</span>
                            {lead.disqualified_reason && (
                                <span className="text-sm text-zinc-400">— {lead.disqualified_reason}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Lead header ── */}
                <div className="bg-zinc-900 px-6 pb-0 pt-6 dark:bg-zinc-950">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white shadow-lg">
                                    {initials(lead.name)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
                                    <p className="mt-0.5 text-sm text-zinc-400">
                                        {[lead.job_title, lead.company_name, lead.industry].filter(Boolean).join(' · ')}
                                    </p>
                                    {/* Badges */}
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {icp.tier && (
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_BG[icp.tier]}`}>
                                                Tier {icp.tier.toUpperCase()}
                                            </span>
                                        )}
                                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ${lead.status === 'qualified' ? 'bg-green-500/20 text-green-400 ring-green-500' : 'bg-zinc-700 text-zinc-300 ring-zinc-600'}`}>
                                            <span className={`size-1.5 rounded-full ${STATUS_DOT[lead.status] ?? 'bg-zinc-400'}`} />
                                            {humanize(lead.status)}
                                        </span>
                                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ${lead.priority === 'hot' ? 'bg-red-500/20 text-red-400 ring-red-500' : 'bg-zinc-700 text-zinc-300 ring-zinc-600'}`}>
                                            <span className={`size-1.5 rounded-full ${PRIORITY_DOT[lead.priority] ?? 'bg-zinc-400'}`} />
                                            {humanize(lead.priority)}
                                        </span>
                                        {lead.source_type && (
                                            <span className="rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300 ring-1 ring-zinc-600">
                                                {humanize(lead.source_type)}
                                                {lead.source_campaign ? ` — ${lead.source_campaign}` : ''}
                                            </span>
                                        )}
                                        {lead.assigned_to && (
                                            <span className="flex items-center gap-1 rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300 ring-1 ring-zinc-600">
                                                <UserCircle className="size-3.5" />
                                                Assigned: {lead.assigned_to.name.split(' ')[0]} {lead.assigned_to.name.split(' ').slice(-1)[0]?.[0]}.
                                            </span>
                                        )}
                                    </div>
                                    {/* Contact row */}
                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-zinc-200">
                                                <Mail className="size-3.5" />{lead.email}
                                            </a>
                                        )}
                                        {lead.phone && (
                                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-zinc-200">
                                                <Phone className="size-3.5" />{lead.phone}
                                            </a>
                                        )}
                                        {lead.linkedin_url && (
                                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-200">
                                                <Link2 className="size-3.5" />LinkedIn
                                            </a>
                                        )}
                                        {lead.company_website && (
                                            <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-200">
                                                <Globe className="size-3.5" />{lead.company_website.replace(/^https?:\/\//, '')}
                                            </a>
                                        )}
                                        {lead.follow_up_due_at && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="size-3.5" />Follow-up: {formatDate(lead.follow_up_due_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ICP circle (top-right of header) */}
                            {icp.score > 0 && (
                                <div className="shrink-0 text-right">
                                    <IcpCircle score={icp.score} tier={icp.tier} size={72} />
                                    <p className={`mt-1 text-xs font-bold uppercase tracking-wide ${TIER_COLOR[icp.tier]}`}>Tier {icp.tier.toUpperCase()}</p>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <nav className="mt-6 -mb-px flex gap-1">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={`border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                                        tab === t.key
                                            ? 'border-white text-white'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* ── Content + sidebar ── */}
                <div className="flex flex-1 items-start">
                    {/* Main content */}
                    <div className="min-w-0 flex-1 p-6">
                        <div className="mx-auto max-w-5xl">
                            {tab === 'overview' && <OverviewTab lead={lead} icp={icp} />}
                            {tab === 'bant' && <BantTab lead={lead} />}
                            {tab === 'activity' && <ActivityTab lead={lead} />}
                            {tab === 'custom_fields' && <CustomFieldsTab lead={lead} customFields={customFields} />}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-l bg-card/30 xl:block">
                        <div className="space-y-4 p-4">
                            {isConverted ? (
                                <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2.5 text-xs font-semibold text-emerald-400">
                                    <CheckCircle2 className="size-3.5" />
                                    Lead Converted
                                </div>
                            ) : (
                                <Button
                                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                    size="sm"
                                    onClick={() => setShowConvertDialog(true)}
                                    disabled={isDisqualified}
                                >
                                    <Zap className="size-4" />
                                    Convert to Opportunity
                                </Button>
                            )}
                            {!isConverted && !isDisqualified && (
                                <button
                                    type="button"
                                    className="w-full text-center text-sm text-red-500 hover:underline"
                                    onClick={() => setShowDisqualifyDialog(true)}
                                >
                                    Disqualify lead
                                </button>
                            )}

                            {/* Assigned rep */}
                            {lead.assigned_to && (
                                <div>
                                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-widest">Assigned Rep</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                            {initials(lead.assigned_to.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{lead.assigned_to.name}</p>
                                        </div>
                                    </div>
                                    <Link href={`/leads/${lead.id}/edit`} className="text-primary mt-1 block text-xs hover:underline">
                                        Reassign →
                                    </Link>
                                </div>
                            )}

                            {/* Lead details */}
                            <div>
                                <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-widest">Lead Details</p>
                                <dl className="space-y-2">
                                    <SidebarField label="Status">
                                        <span className="flex items-center gap-1.5 text-xs font-medium capitalize">
                                            <span className={`size-1.5 rounded-full ${STATUS_DOT[lead.status] ?? 'bg-muted-foreground'}`} />
                                            {humanize(lead.status)}
                                        </span>
                                    </SidebarField>
                                    <SidebarField label="Priority">
                                        <span className="flex items-center gap-1.5 text-xs font-medium capitalize">
                                            <span className={`size-1.5 rounded-full ${PRIORITY_DOT[lead.priority] ?? 'bg-muted-foreground'}`} />
                                            {humanize(lead.priority)}
                                        </span>
                                    </SidebarField>
                                    {icp.tier && (
                                        <SidebarField label="ICP tier">
                                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase ${TIER_BG[icp.tier]}`}>
                                                Tier {icp.tier.toUpperCase()}
                                            </span>
                                        </SidebarField>
                                    )}
                                    <SidebarField label="Follow-up">{formatDate(lead.follow_up_due_at)}</SidebarField>
                                    <SidebarField label="Source">{humanize(lead.source_type)}</SidebarField>
                                    {lead.source_campaign && <SidebarField label="Campaign">{lead.source_campaign}</SidebarField>}
                                </dl>
                            </div>

                            {/* Engagement */}
                            <div>
                                <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-widest">Engagement</p>
                                <dl className="space-y-2">
                                    <SidebarField label="Touchpoints">{String(lead.touchpoint_count ?? 0)}</SidebarField>
                                    <SidebarField label="First contacted">{formatDate(lead.first_contacted_at)}</SidebarField>
                                    <SidebarField label="Last activity">{timeAgo(lead.last_activity_at)}</SidebarField>
                                    <SidebarField label="Lead age">{leadAge(lead.created_at)}</SidebarField>
                                </dl>
                            </div>

                            {/* Created */}
                            <div>
                                <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-widest">Created</p>
                                <dl className="space-y-2">
                                    <SidebarField label="Date">
                                        {lead.created_at ? new Date(lead.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                                    </SidebarField>
                                    <SidebarField label="Created by">{lead.created_by?.name ?? 'System (API)'}</SidebarField>
                                </dl>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* ── Convert dialog ── */}
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="size-4 text-emerald-500" />
                            Convert {lead.name} to an Opportunity?
                        </DialogTitle>
                        <DialogDescription>
                            The following records will be created or matched automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-1 space-y-2">
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                                <UserCircle className="size-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Contact</p>
                                <p className="text-sm font-medium">{lead.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {[lead.email, lead.job_title].filter(Boolean).join(' · ') || '—'}
                                </p>
                            </div>
                        </div>
                        {lead.company_name && (
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
                                    <p className="text-sm font-medium">{lead.company_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lead.industry ? humanize(lead.industry) : 'No industry set'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                <BriefcaseBusiness className="size-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Opportunity</p>
                                <p className="text-sm font-medium">{(lead.company_name ?? lead.name) + ' — Opportunity'}</p>
                                <p className="text-xs text-muted-foreground">Stage: New</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConvertDialog(false)} disabled={converting}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={convertToOpportunity}
                            disabled={converting}
                        >
                            <Zap className="size-3.5" />
                            {converting ? 'Converting…' : 'Convert to Opportunity'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Disqualify dialog ── */}
            <Dialog open={showDisqualifyDialog} onOpenChange={setShowDisqualifyDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="size-4 text-red-500" />
                            Disqualify {lead.name}?
                        </DialogTitle>
                        <DialogDescription>
                            The lead will be marked as disqualified and removed from active pipelines.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-1">
                        <label className="text-sm font-medium">Reason <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <textarea
                            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="e.g. No budget, wrong fit, bad timing…"
                            rows={3}
                            value={disqualifyForm.data.reason}
                            onChange={(e) => disqualifyForm.setData('reason', e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisqualifyDialog(false)} disabled={disqualifyForm.processing}>Cancel</Button>
                        <Button variant="destructive" onClick={disqualify} disabled={disqualifyForm.processing}>
                            {disqualifyForm.processing ? 'Disqualifying…' : 'Disqualify Lead'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// ─── Sidebar field helper ─────────────────────────────────────────────────────

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <dt className="text-muted-foreground shrink-0 text-xs">{label}</dt>
            <dd className="text-right text-xs font-medium">{children}</dd>
        </div>
    );
}

// ─── ICP circle ──────────────────────────────────────────────────────────────

function IcpCircle({ score, tier, size = 72 }: { score: number; tier: string; size?: number }) {
    const r = size * 0.42;
    const circ = 2 * Math.PI * r;
    const cx = size / 2;
    const COLORS: Record<string, string> = { a: '#22c55e', b: '#3b82f6', c: '#f59e0b', d: '#ef4444' };
    const color = COLORS[tier] ?? '#94a3b8';
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth={size * 0.09} className="stroke-zinc-700" />
            <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth={size * 0.09} stroke={color} strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round">
                <title>{score} / 100</title>
            </circle>
            <text x={cx} y={cx} dominantBaseline="middle" textAnchor="middle" className="rotate-90" fill="white" fontSize={size * 0.22} fontWeight="bold" transform={`rotate(90, ${cx}, ${cx})`}>
                {score}
            </text>
            <text x={cx} y={cx + size * 0.16} dominantBaseline="middle" textAnchor="middle" fill="#71717a" fontSize={size * 0.13} transform={`rotate(90, ${cx}, ${cx + size * 0.16})`}>
                / 100
            </text>
        </svg>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

type IcpResult = { score: number; tier: string; criteria: { key: string; label: string; points: number; met: boolean }[] };

function OverviewTab({ lead, icp }: { lead: Lead; icp: IcpResult }) {
    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Left: 3 detail cards */}
            <div className="space-y-5 lg:col-span-3">
                {/* Contact details */}
                <Card title="Contact details" icon={User} editHref={`/leads/${lead.id}/edit`}>
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        <DL label="Full name" value={lead.name} />
                        <DL label="Job title" value={lead.job_title} />
                        <DL label="Seniority" value={lead.seniority_level ? humanize(lead.seniority_level, /_/g) : null} />
                        <DL label="Email" value={lead.email ? <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">{lead.email}</a> : null} />
                        <DL label="Phone" value={lead.phone ? <a href={`tel:${lead.phone}`} className="text-blue-400 hover:underline">{lead.phone}</a> : null} />
                        <DL label="LinkedIn" value={lead.linkedin_url ? <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">/in/{lead.linkedin_url.split('/in/')[1] ?? '…'}</a> : null} />
                    </div>
                </Card>

                {/* Company */}
                <Card title="Company" icon={Building2} editHref={`/leads/${lead.id}/edit`}>
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        <DL label="Company" value={lead.company_name} />
                        <DL label="Industry" value={lead.industry ? humanize(lead.industry, /_/g) : null} />
                        <DL label="Size" value={lead.company_size ? companySizeLabel(lead.company_size) : null} />
                        <DL label="Annual revenue" value={revenueLabel(lead.annual_revenue)} />
                        <DL label="Country" value={lead.country} />
                        <DL label="Region" value={lead.region} />
                        <DL label="Website" value={lead.company_website ? <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{lead.company_website.replace(/^https?:\/\//, '')}</a> : null} />
                    </div>
                </Card>

                {/* Qualification */}
                <Card title="Qualification" icon={Zap} editHref={`/leads/${lead.id}/edit`}>
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        <DL label="Source" value={humanize(lead.source_type)} />
                        <DL label="Interest area" value={lead.interest_area} />
                        {lead.pain_points && <div className="sm:col-span-2"><DL label="Pain points" value={lead.pain_points} /></div>}
                        <DL label="Competitor" value={lead.competitor_mention ? <span className="font-medium text-amber-400">{lead.competitor_mention}</span> : null} />
                        {lead.initial_notes && <div className="sm:col-span-2"><DL label="Initial notes" value={lead.initial_notes} /></div>}
                    </div>
                </Card>
            </div>

            {/* Right: ICP + BANT snapshot + recent activity */}
            <div className="space-y-5 lg:col-span-2">
                {/* ICP score breakdown */}
                <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">ICP score breakdown</h3>
                        <span className="font-bold text-zinc-300">{icp.score} / 100</span>
                    </div>
                    {/* Gradient bar */}
                    <div className="mt-3 mb-1">
                        <div className="relative h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-blue-400 to-green-500">
                            <div className="absolute inset-y-0 right-0" style={{ left: `${icp.score}%`, background: 'rgba(0,0,0,0.35)' }} />
                            <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${icp.score}%` }} />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                            <span>D (0–39)</span><span>C (40–59)</span><span>B (60–79)</span><span>A (80–100)</span>
                        </div>
                    </div>
                    {/* Criteria */}
                    <ul className="mt-4 space-y-2.5">
                        {icp.criteria.map((c) => (
                            <li key={c.key} className="flex items-center gap-2 text-xs">
                                <span className={`shrink-0 font-bold ${c.met ? 'text-green-400' : 'text-zinc-600'}`}>{c.met ? '✓' : '○'}</span>
                                <span className={`flex-1 ${c.met ? 'text-zinc-200' : 'text-zinc-500'}`}>{c.label}</span>
                                <div className="w-24 overflow-hidden rounded-full bg-zinc-800 h-1.5">
                                    <div className={`h-full rounded-full transition-all ${c.met ? 'bg-green-500' : 'bg-zinc-700'}`} style={{ width: c.met ? '100%' : '0%' }} />
                                </div>
                                <span className={`w-8 text-right font-semibold ${c.met ? 'text-green-400' : 'text-zinc-600'}`}>+{c.points}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* BANT snapshot */}
                <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <BarChart2 className="size-4 text-teal-400" />
                            BANT snapshot
                        </h3>
                        <button type="button" onClick={() => {}} className="text-xs text-blue-400 hover:underline">
                            View full BANT →
                        </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <BantCard letter="B" label="Budget" value={humanize(lead.bant_budget)} sub={lead.bant_budget_amount ? `~$${Number(lead.bant_budget_amount).toLocaleString()}` : null} color="text-blue-400" />
                        <BantCard letter="A" label="Authority" value={humanize(lead.bant_authority, /_/g)} sub={lead.seniority_level ? `${humanize(lead.seniority_level, /_/g)} level` : null} color="text-violet-400" />
                        <BantCard letter="N" label="Need" value={humanize(lead.bant_need_score)} sub={lead.bant_need ?? null} color="text-emerald-400" />
                        <BantCard letter="T" label="Timeline" value={humanize(lead.bant_timeline)} sub={bantTimelineSub(lead.bant_timeline)} color="text-amber-400" />
                    </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <Clock className="size-4 text-zinc-400" />
                            Recent activity
                        </h3>
                        <span className="text-xs text-blue-400">View all →</span>
                    </div>
                    <div className="mt-3 flex flex-col items-center justify-center gap-2 py-6 text-center">
                        <Clock className="size-8 text-zinc-700" />
                        <p className="text-xs text-zinc-500">Activity timeline coming in a future sprint.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function bantTimelineSub(v: string | null): string | null {
    const map: Record<string, string> = {
        immediate: '< 1 month', short: '1–3 months', medium: '3–6 months', long: '6+ months',
    };
    return v ? (map[v] ?? null) : null;
}

function Card({ title, icon: Icon, editHref, children }: { title: string; icon: React.ElementType; editHref: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 text-zinc-400" />
                    {title}
                </h3>
                <Link href={editHref} className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                    <Pencil className="size-3" />Edit
                </Link>
            </div>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{children}</dl>
        </div>
    );
}

function BantCard({ letter, label, value, sub, color }: { letter: string; label: string; value: string; sub: string | null; color: string }) {
    return (
        <div className="rounded-lg border bg-zinc-900/50 p-3">
            <div className={`text-lg font-black ${color}`}>{letter}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</div>
            <div className={`mt-1 text-sm font-semibold ${value === '—' ? 'text-zinc-600' : 'text-zinc-100'}`}>{value}</div>
            {sub && <div className="mt-0.5 truncate text-xs text-zinc-500">{sub}</div>}
        </div>
    );
}

// ─── BANT Tab ─────────────────────────────────────────────────────────────────

function BantTab({ lead }: { lead: Lead }) {
    return (
        <div className="max-w-2xl space-y-5">
            <div className="rounded-xl border bg-card p-5 shadow-xs">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                    <BarChart2 className="size-4 text-teal-400" />
                    BANT Qualification
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <BantCard letter="B" label="Budget" value={humanize(lead.bant_budget)} sub={lead.bant_budget_amount ? `$${Number(lead.bant_budget_amount).toLocaleString()}` : null} color="text-blue-400" />
                    <BantCard letter="A" label="Authority" value={humanize(lead.bant_authority, /_/g)} sub={null} color="text-violet-400" />
                    <BantCard letter="N" label="Need strength" value={humanize(lead.bant_need_score)} sub={lead.bant_need} color="text-emerald-400" />
                    <BantCard letter="T" label="Timeline" value={humanize(lead.bant_timeline)} sub={bantTimelineSub(lead.bant_timeline)} color="text-amber-400" />
                </div>
                {lead.bant_need && (
                    <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Need description</p>
                        <p className="mt-1 text-sm text-zinc-200">{lead.bant_need}</p>
                    </div>
                )}
            </div>
            <Button asChild size="sm" variant="outline">
                <Link href={`/leads/${lead.id}/edit`}>Edit BANT fields</Link>
            </Button>
        </div>
    );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ lead: _ }: { lead: Lead }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Clock className="size-12 text-zinc-700" />
            <p className="font-medium text-zinc-400">Activity timeline</p>
            <p className="text-sm text-zinc-600">Calls, emails, notes, and AI reviews will appear here.<br />Coming in a future sprint.</p>
        </div>
    );
}

// ─── Custom Fields Tab ────────────────────────────────────────────────────────

function CustomFieldsTab({ lead, customFields }: { lead: Lead; customFields: LeadFieldDef[] }) {
    const valueMap: Record<string, string> = {};
    for (const fv of lead.field_values ?? []) {
        valueMap[fv.lead_field_id] = fv.value ?? '';
    }

    if (customFields.length === 0) {
        return (
            <div className="py-12 text-center text-sm text-zinc-500">
                No custom fields configured yet.{' '}
                <Link href="/settings/lead-fields" className="text-blue-400 hover:underline">
                    Add fields in Settings.
                </Link>
            </div>
        );
    }

    const bySection = customFields.reduce<Record<string, LeadFieldDef[]>>((acc, f) => {
        (acc[f.section] ??= []).push(f);
        return acc;
    }, {});

    return (
        <div className="max-w-2xl space-y-6">
            {Object.entries(bySection).map(([section, fields]) => (
                <div key={section} className="rounded-xl border bg-card p-5 shadow-xs">
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 capitalize">{section}</h2>
                    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                                <DL label={field.label} value={valueMap[field.id] || null} />
                            </div>
                        ))}
                    </dl>
                </div>
            ))}
            <Button asChild size="sm" variant="outline">
                <Link href={`/leads/${lead.id}/edit`}>Edit custom fields</Link>
            </Button>
        </div>
    );
}
