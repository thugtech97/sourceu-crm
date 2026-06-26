import { CustomFieldRenderer, type LeadFieldDef } from '@/components/leads/custom-field-renderer';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { BarChart2, Building2, Check, ExternalLink, Link2, Mail, Phone, Sparkles, User, Zap } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leads', href: '/leads' },
    { title: 'New lead', href: '/leads/create' },
];

type SalesRep = { id: number; name: string };
type Props = { salesReps: SalesRep[]; customFields: LeadFieldDef[] };

export type LeadForm = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    linkedin_url: string;
    job_title: string;
    seniority_level: string;
    company_name: string;
    industry: string;
    company_size: string;
    annual_revenue: string;
    company_website: string;
    country: string;
    region: string;
    source_type: string;
    source_campaign: string;
    source_url: string;
    status: string;
    priority: string;
    assigned_to: string;
    follow_up_due_at: string;
    interest_area: string;
    pain_points: string;
    competitor_mention: string;
    initial_notes: string;
    bant_budget: string;
    bant_budget_amount: string;
    bant_authority: string;
    bant_need: string;
    bant_need_score: string;
    bant_timeline: string;
    custom_fields: Record<string, string>;
};

// ─── ICP Scoring ────────────────────────────────────────────────────────────

type IcpCriterion = { key: string; label: string; points: number; check: (f: LeadForm) => boolean };

const ICP_CRITERIA: IcpCriterion[] = [
    {
        key: 'industry',
        label: 'Industry match',
        points: 20,
        check: (f) => ['technology', 'software', 'saas', 'healthcare', 'finance', 'financial_services', 'professional_services'].includes(f.industry),
    },
    {
        key: 'company_size',
        label: 'Company size 51–200',
        points: 20,
        check: (f) => ['51_200', '201_500'].includes(f.company_size),
    },
    {
        key: 'seniority',
        label: 'Director seniority',
        points: 15,
        check: (f) => ['c_suite', 'vp', 'director'].includes(f.seniority_level),
    },
    {
        key: 'country',
        label: 'Country AU / NZ',
        points: 10,
        check: (f) => {
            const v = f.country.toLowerCase();
            return v === 'australia' || v === 'new zealand' || v === 'au' || v === 'nz';
        },
    },
    {
        key: 'revenue_5m',
        label: 'Revenue $5M+',
        points: 15,
        check: (f) => ['5m_10m', '10m_50m', '50m_100m', '100m_500m', '500m_plus'].includes(f.annual_revenue),
    },
    {
        key: 'job_title',
        label: 'Job title keywords',
        points: 10,
        check: (f) => ['head', 'chief', 'ceo', 'cto', 'coo', 'cfo', 'vp', 'president', 'founder', 'director'].some((k) => f.job_title.toLowerCase().includes(k)),
    },
    {
        key: 'revenue_bracket',
        label: 'Annual revenue bracket',
        points: 10,
        check: (f) => ['10m_50m', '50m_100m', '100m_500m', '500m_plus'].includes(f.annual_revenue),
    },
];

function useIcpScore(data: LeadForm) {
    return useMemo(() => {
        const criteria = ICP_CRITERIA.map((c) => ({ ...c, met: c.check(data) }));
        const score = Math.min(100, criteria.reduce((sum, c) => sum + (c.met ? c.points : 0), 0));
        const tier = score >= 76 ? 'a' : score >= 51 ? 'b' : score >= 26 ? 'c' : 'd';
        return { score, tier, criteria };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.industry, data.company_size, data.seniority_level, data.country, data.annual_revenue, data.job_title]);
}

// ─── Sections ───────────────────────────────────────────────────────────────

const SECTIONS = [
    { id: 'contact-details', label: 'Contact details' },
    { id: 'company', label: 'Company' },
    { id: 'lead-source', label: 'Lead source' },
    { id: 'qualification', label: 'Qualification' },
    { id: 'bant', label: 'BANT' },
    { id: 'custom-fields', label: 'Custom fields' },
];

const REQUIRED = [
    { key: 'first_name' as keyof LeadForm, label: 'First name' },
    { key: 'last_name' as keyof LeadForm, label: 'Last name' },
    { key: 'email' as keyof LeadForm, label: 'Email' },
    { key: 'source_type' as keyof LeadForm, label: 'Source type' },
];

// ─── Small helpers ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, iconBg, title, description }: { icon: React.ElementType; iconBg: string; title: string; description: string }) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className="size-5 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>
            <hr className="mt-4" />
        </div>
    );
}

function IconInput({ icon: Icon, ...props }: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Icon className="text-muted-foreground size-4" />
            </span>
            <Input className="pl-9" {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
        </div>
    );
}

function NativeSelect({ value, onChange, children, id }: { value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; children: React.ReactNode; id?: string }) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
            {children}
        </select>
    );
}

function IcpScoreCircle({ score, tier }: { score: number; tier: string }) {
    const r = 38;
    const circ = 2 * Math.PI * r;
    const COLORS: Record<string, string> = { a: '#22c55e', b: '#3b82f6', c: '#f59e0b', d: '#ef4444' };
    const color = COLORS[tier] ?? '#94a3b8';
    return (
        <div className="flex flex-col items-center gap-1 py-2">
            <div className="relative size-20">
                <svg viewBox="0 0 100 100" className="-rotate-90 size-20">
                    <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-muted/40" />
                    <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" stroke={color} strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{score}</span>
                </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
                Tier {tier.toUpperCase()}
            </span>
            <span className="text-muted-foreground text-center text-xs">Updates as you fill in the form</span>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreateLead({ salesReps, customFields }: Props) {
    const { data, setData, post, processing, errors } = useForm<LeadForm>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        job_title: '',
        seniority_level: '',
        company_name: '',
        industry: '',
        company_size: '',
        annual_revenue: '',
        company_website: '',
        country: '',
        region: '',
        source_type: 'website',
        source_campaign: '',
        source_url: '',
        status: 'new',
        priority: 'cold',
        assigned_to: '',
        follow_up_due_at: '',
        interest_area: '',
        pain_points: '',
        competitor_mention: '',
        initial_notes: '',
        bant_budget: '',
        bant_budget_amount: '',
        bant_authority: '',
        bant_need: '',
        bant_need_score: '',
        bant_timeline: '',
        custom_fields: {},
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/leads');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Lead" />
            <form onSubmit={submit} className="flex flex-1 flex-col">
                <LeadFormFields
                    data={data}
                    setData={setData as LeadFormSetData}
                    errors={errors}
                    salesReps={salesReps}
                    customFields={customFields}
                    processing={processing}
                    submitLabel="Save Lead"
                    cancelHref="/leads"
                    pageTitle="New lead"
                />
            </form>
        </AppLayout>
    );
}

// ─── Shared form layout (used by both create + edit) ────────────────────────

export type LeadFormSetData = <K extends keyof LeadForm>(key: K, value: LeadForm[K]) => void;

export function LeadFormFields({
    data,
    setData,
    errors,
    salesReps,
    customFields = [],
    processing,
    submitLabel = 'Save',
    cancelHref,
    pageTitle,
}: {
    data: LeadForm;
    setData: LeadFormSetData;
    errors: Partial<Record<string, string>>;
    salesReps: SalesRep[];
    customFields?: LeadFieldDef[];
    processing: boolean;
    submitLabel?: string;
    cancelHref: string;
    pageTitle: string;
}) {
    const icp = useIcpScore(data);
    const [activeSection, setActiveSection] = useState('contact-details');
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const sections = customFields.length > 0 ? SECTIONS : SECTIONS.filter((s) => s.id !== 'custom-fields');

    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        Object.entries(sectionRefs.current).forEach(([id, el]) => {
            if (!el) return;
            const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveSection(id); }, { rootMargin: '-10% 0px -70% 0px' });
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, []);

    function scrollTo(id: string) {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function sd(key: keyof LeadForm) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setData(key, e.target.value as LeadForm[typeof key]);
    }

    function setCustomField(fieldId: string, value: string) {
        setData('custom_fields', { ...data.custom_fields, [fieldId]: value });
    }

    const requiredStatus = REQUIRED.map((f) => ({ ...f, filled: Boolean((data[f.key] as string)?.trim()) }));

    return (
        <>
            {/* ── Action bar ── */}
            <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                        <Link href={cancelHref}>Cancel</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing}>
                        <Check className="size-4" />
                        {submitLabel}
                    </Button>
                </div>
            </div>

            {/* ── Two-column ── */}
            <div className="flex flex-1 items-start">
                {/* Form sections */}
                <div className="min-w-0 flex-1 px-6 py-8">
                    <div className="mx-auto max-w-3xl space-y-12">

                        {/* Contact details */}
                        <section id="contact-details" ref={(el) => { sectionRefs.current['contact-details'] = el; }}>
                            <SectionHeader icon={User} iconBg="bg-violet-600" title="Contact details" description="Basic personal information for this lead" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="first_name">First name <span className="text-destructive">*</span></Label>
                                    <Input id="first_name" value={data.first_name} onChange={sd('first_name')} required />
                                    <InputError message={errors.first_name} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="last_name">Last name <span className="text-destructive">*</span></Label>
                                    <Input id="last_name" value={data.last_name} onChange={sd('last_name')} required />
                                    <InputError message={errors.last_name} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                                    <IconInput icon={Mail} id="email" type="email" value={data.email} onChange={sd('email')} required />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="phone">Phone</Label>
                                    <IconInput icon={Phone} id="phone" type="tel" value={data.phone} onChange={sd('phone')} />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="job_title">Job title</Label>
                                    <Input id="job_title" value={data.job_title} onChange={sd('job_title')} />
                                    <InputError message={errors.job_title} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="seniority_level">Seniority level</Label>
                                    <NativeSelect id="seniority_level" value={data.seniority_level} onChange={sd('seniority_level')}>
                                        <option value="">— Select —</option>
                                        <option value="c_suite">C-Suite</option>
                                        <option value="vp">VP</option>
                                        <option value="director">Director</option>
                                        <option value="manager">Manager</option>
                                        <option value="individual">Individual</option>
                                    </NativeSelect>
                                    <InputError message={errors.seniority_level} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                                    <IconInput icon={Link2} id="linkedin_url" type="url" value={data.linkedin_url} onChange={sd('linkedin_url')} placeholder="linkedin.com/in/…" />
                                    <InputError message={errors.linkedin_url} />
                                </div>
                            </div>
                        </section>

                        {/* Company */}
                        <section id="company" ref={(el) => { sectionRefs.current['company'] = el; }}>
                            <SectionHeader icon={Building2} iconBg="bg-emerald-600" title="Company" description="Organisation and firmographic details" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="company_name">Company name</Label>
                                    <Input id="company_name" value={data.company_name} onChange={sd('company_name')} />
                                    <InputError message={errors.company_name} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="industry">Industry</Label>
                                    <NativeSelect id="industry" value={data.industry} onChange={sd('industry')}>
                                        <option value="">— Select —</option>
                                        <option value="technology">Technology</option>
                                        <option value="software">Software / SaaS</option>
                                        <option value="healthcare">Healthcare / Medical</option>
                                        <option value="finance">Finance & Banking</option>
                                        <option value="financial_services">Financial Services</option>
                                        <option value="professional_services">Professional Services</option>
                                        <option value="retail">Retail / E-commerce</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="education">Education</option>
                                        <option value="real_estate">Real Estate</option>
                                        <option value="construction">Construction</option>
                                        <option value="media">Media & Advertising</option>
                                        <option value="government">Government / Non-profit</option>
                                        <option value="other">Other</option>
                                    </NativeSelect>
                                    <InputError message={errors.industry} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="company_size">Company size</Label>
                                    <NativeSelect id="company_size" value={data.company_size} onChange={sd('company_size')}>
                                        <option value="">— Select —</option>
                                        <option value="1_10">1–10</option>
                                        <option value="11_50">11–50</option>
                                        <option value="51_200">51–200</option>
                                        <option value="201_500">201–500</option>
                                        <option value="500_1000">500–1,000</option>
                                        <option value="1000_plus">1,000+</option>
                                    </NativeSelect>
                                    <InputError message={errors.company_size} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="annual_revenue">Annual revenue</Label>
                                    <NativeSelect id="annual_revenue" value={data.annual_revenue} onChange={sd('annual_revenue')}>
                                        <option value="">— Select —</option>
                                        <option value="under_1m">Under $1M</option>
                                        <option value="1m_5m">$1M – $5M</option>
                                        <option value="5m_10m">$5M – $10M</option>
                                        <option value="10m_50m">$10M – $50M</option>
                                        <option value="50m_100m">$50M – $100M</option>
                                        <option value="100m_500m">$100M – $500M</option>
                                        <option value="500m_plus">$500M+</option>
                                    </NativeSelect>
                                    <InputError message={errors.annual_revenue} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="country">Country</Label>
                                    <NativeSelect id="country" value={data.country} onChange={sd('country')}>
                                        <option value="">— Select —</option>
                                        <option value="Australia">Australia</option>
                                        <option value="New Zealand">New Zealand</option>
                                        <option value="United States">United States</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Singapore">Singapore</option>
                                        <option value="India">India</option>
                                        <option value="Germany">Germany</option>
                                        <option value="France">France</option>
                                        <option value="Netherlands">Netherlands</option>
                                        <option value="Ireland">Ireland</option>
                                        <option value="South Africa">South Africa</option>
                                        <option value="UAE">UAE</option>
                                        <option value="Other">Other</option>
                                    </NativeSelect>
                                    <InputError message={errors.country} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="region">Region / State</Label>
                                    <Input id="region" value={data.region} onChange={sd('region')} />
                                    <InputError message={errors.region} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="company_website">Company website</Label>
                                    <IconInput icon={ExternalLink} id="company_website" type="url" value={data.company_website} onChange={sd('company_website')} placeholder="https://…" />
                                    <InputError message={errors.company_website} />
                                </div>
                            </div>
                        </section>

                        {/* Lead source */}
                        <section id="lead-source" ref={(el) => { sectionRefs.current['lead-source'] = el; }}>
                            <SectionHeader icon={ExternalLink} iconBg="bg-amber-600" title="Lead source" description="Where did this lead come from?" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="source_type">Source type <span className="text-destructive">*</span></Label>
                                    <NativeSelect id="source_type" value={data.source_type} onChange={sd('source_type')}>
                                        <option value="website">Website</option>
                                        <option value="referral">Referral</option>
                                        <option value="cold_outreach">Cold outreach</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="ad">Ad</option>
                                        <option value="event">Event</option>
                                        <option value="partner">Partner</option>
                                        <option value="api">API</option>
                                        <option value="import">Import</option>
                                        <option value="other">Other</option>
                                    </NativeSelect>
                                    <InputError message={errors.source_type} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="source_campaign">Campaign</Label>
                                    <Input id="source_campaign" value={data.source_campaign} onChange={sd('source_campaign')} />
                                    <InputError message={errors.source_campaign} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="source_url">Source URL</Label>
                                    <IconInput icon={Link2} id="source_url" type="url" value={data.source_url} onChange={sd('source_url')} placeholder="https://…" />
                                    <InputError message={errors.source_url} />
                                </div>
                            </div>
                        </section>

                        {/* Qualification */}
                        <section id="qualification" ref={(el) => { sectionRefs.current['qualification'] = el; }}>
                            <SectionHeader icon={Zap} iconBg="bg-yellow-500" title="Qualification" description="Priority, interest, and initial notes" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="status">Status</Label>
                                    <NativeSelect id="status" value={data.status} onChange={sd('status')}>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="working">Working</option>
                                        <option value="nurturing">Nurturing</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="disqualified">Disqualified</option>
                                    </NativeSelect>
                                    <InputError message={errors.status} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="priority">Priority</Label>
                                    <NativeSelect id="priority" value={data.priority} onChange={sd('priority')}>
                                        <option value="cold">Cold</option>
                                        <option value="warm">Warm</option>
                                        <option value="hot">Hot</option>
                                    </NativeSelect>
                                    <InputError message={errors.priority} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="assigned_to">Assigned to</Label>
                                    <NativeSelect id="assigned_to" value={data.assigned_to} onChange={sd('assigned_to')}>
                                        <option value="">Unassigned</option>
                                        {salesReps.map((r) => (
                                            <option key={r.id} value={String(r.id)}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <InputError message={errors.assigned_to} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="follow_up_due_at">Follow-up date</Label>
                                    <Input id="follow_up_due_at" type="date" value={data.follow_up_due_at} onChange={sd('follow_up_due_at')} />
                                    <InputError message={errors.follow_up_due_at} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="interest_area">Interest area</Label>
                                    <Input id="interest_area" value={data.interest_area} onChange={sd('interest_area')} placeholder="e.g. CRM platform, enterprise plan…" />
                                    <InputError message={errors.interest_area} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="pain_points">Pain points</Label>
                                    <textarea
                                        id="pain_points"
                                        className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                        value={data.pain_points}
                                        onChange={sd('pain_points')}
                                    />
                                    <InputError message={errors.pain_points} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="competitor_mention">Competitor mention</Label>
                                    <Input id="competitor_mention" value={data.competitor_mention} onChange={sd('competitor_mention')} />
                                    <InputError message={errors.competitor_mention} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="initial_notes">Initial notes</Label>
                                    <textarea
                                        id="initial_notes"
                                        className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                        placeholder="Any other notes about this lead…"
                                        value={data.initial_notes}
                                        onChange={sd('initial_notes')}
                                    />
                                    <InputError message={errors.initial_notes} />
                                </div>
                            </div>
                        </section>

                        {/* BANT */}
                        <section id="bant" ref={(el) => { sectionRefs.current['bant'] = el; }}>
                            <SectionHeader icon={BarChart2} iconBg="bg-teal-600" title="BANT qualification" description="Budget, authority, need, and timeline" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="bant_budget">Budget</Label>
                                    <NativeSelect id="bant_budget" value={data.bant_budget} onChange={sd('bant_budget')}>
                                        <option value="">— Select —</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="likely">Likely</option>
                                        <option value="unknown">Unknown</option>
                                        <option value="none">None</option>
                                    </NativeSelect>
                                    <InputError message={errors.bant_budget} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bant_budget_amount">Budget amount</Label>
                                    <div className="relative">
                                        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">$</span>
                                        <Input id="bant_budget_amount" type="number" min="0" className="pl-7" value={data.bant_budget_amount} onChange={sd('bant_budget_amount')} placeholder="0" />
                                    </div>
                                    <InputError message={errors.bant_budget_amount} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bant_authority">Authority</Label>
                                    <NativeSelect id="bant_authority" value={data.bant_authority} onChange={sd('bant_authority')}>
                                        <option value="">— Select —</option>
                                        <option value="decision_maker">Decision maker</option>
                                        <option value="influencer">Influencer</option>
                                        <option value="champion">Champion</option>
                                        <option value="unknown">Unknown</option>
                                    </NativeSelect>
                                    <InputError message={errors.bant_authority} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bant_timeline">Timeline</Label>
                                    <NativeSelect id="bant_timeline" value={data.bant_timeline} onChange={sd('bant_timeline')}>
                                        <option value="">— Select —</option>
                                        <option value="immediate">Immediate (&lt; 1 month)</option>
                                        <option value="short">Short (1–3 months)</option>
                                        <option value="medium">Medium (3–6 months)</option>
                                        <option value="long">Long (6+ months)</option>
                                        <option value="unknown">Unknown</option>
                                    </NativeSelect>
                                    <InputError message={errors.bant_timeline} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="bant_need">Need</Label>
                                    <textarea
                                        id="bant_need"
                                        className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                        value={data.bant_need}
                                        onChange={sd('bant_need')}
                                    />
                                    <InputError message={errors.bant_need} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bant_need_score">Need strength</Label>
                                    <NativeSelect id="bant_need_score" value={data.bant_need_score} onChange={sd('bant_need_score')}>
                                        <option value="">— Select —</option>
                                        <option value="strong">Strong</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="low">Low</option>
                                        <option value="none">None</option>
                                    </NativeSelect>
                                    <InputError message={errors.bant_need_score} />
                                </div>
                            </div>
                        </section>

                        {/* Custom fields */}
                        {customFields.length > 0 && (
                            <section id="custom-fields" ref={(el) => { sectionRefs.current['custom-fields'] = el; }}>
                                <SectionHeader icon={Sparkles} iconBg="bg-purple-600" title="Custom fields" description="Additional fields configured by your admin" />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {customFields.map((field) => (
                                        <div key={field.id} className={field.type === 'textarea' || field.type === 'toggle' ? 'sm:col-span-2' : ''}>
                                            <CustomFieldRenderer
                                                field={field}
                                                value={data.custom_fields[field.id] ?? ''}
                                                onChange={(v) => setCustomField(field.id, v)}
                                                error={errors[`custom_fields.${field.id}`]}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* ── Sticky sidebar ── */}
                <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-l bg-card/30 xl:block">
                    <div className="space-y-4 p-4">
                        {/* Section nav */}
                        <div>
                            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">Sections</p>
                            <nav className="space-y-0.5">
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => scrollTo(s.id)}
                                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                                            activeSection === s.id ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <span className={`size-1.5 rounded-full ${activeSection === s.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                        {s.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* ICP Score */}
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">ICP Score Preview</p>
                            <IcpScoreCircle score={icp.score} tier={icp.tier} />
                        </div>

                        {/* Score breakdown */}
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">Score Breakdown</p>
                            <ul className="space-y-2">
                                {icp.criteria.map((c) => (
                                    <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            {c.met ? (
                                                <Check className="size-3 shrink-0 text-green-500" />
                                            ) : (
                                                <span className="border-muted-foreground/40 size-3 shrink-0 rounded-full border" />
                                            )}
                                            <span className={`truncate ${c.met ? 'text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
                                        </div>
                                        <span className={`shrink-0 font-medium ${c.met ? 'text-green-500' : 'text-muted-foreground/40'}`}>+{c.points}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Required fields */}
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">Required Fields</p>
                            <ul className="space-y-1.5">
                                {requiredStatus.map((f) => (
                                    <li key={f.key} className="flex items-center gap-2 text-xs">
                                        <span className={`size-2 rounded-full ${f.filled ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                                        <span className={f.filled ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
                                    </li>
                                ))}
                                <li className="flex items-center gap-2 text-xs">
                                    <span className="bg-muted-foreground/30 size-2 rounded-full" />
                                    <span className="text-muted-foreground">Status (auto: New)</span>
                                </li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full" size="sm" disabled={processing}>
                            <Check className="size-4" />
                            {submitLabel}
                        </Button>
                    </div>
                </aside>
            </div>
        </>
    );
}
