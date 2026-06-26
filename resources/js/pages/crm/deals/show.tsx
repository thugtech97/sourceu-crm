import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    BriefcaseBusiness,
    Building2,
    Calendar,
    CheckCircle2,
    DollarSign,
    Pencil,
    Trash2,
    TrendingUp,
    UserCircle,
} from 'lucide-react';
import { useState } from 'react';

type Contact = { id: number; first_name: string; last_name: string; email: string | null; phone: string | null; job_title: string | null };
type Account = { id: number; name: string; industry: string | null; website: string | null };
type Activity = { id: number; type: string; subject: string; body: string | null; completed_at: string | null };
type Deal = {
    id: number; name: string; stage: string; value: string; probability: number;
    expected_close_date: string | null; notes: string | null; created_at: string;
    meeting_booked_at: string | null; meeting_outcome: string | null; meeting_outcome_notes: string | null;
    contact?: Contact | null;
    account?: Account | null;
    activities: Activity[];
};

type Props = { deal: Deal };

const STAGE_STYLES: Record<string, string> = {
    new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    meeting_booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    qualified: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    won: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    warm_email_nurture: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    dnc: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    lost: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

const PIPELINE_STAGES = ['new', 'meeting_booked', 'qualified', 'proposal', 'won'] as const;

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
function stageLabel(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function contactName(c: Contact) { return `${c.first_name} ${c.last_name}`.trim(); }
function probColor(p: number) { return p >= 70 ? 'bg-green-500' : p >= 40 ? 'bg-amber-500' : 'bg-slate-400'; }
function activityIcon(type: string) {
    const map: Record<string, string> = { note: '📝', call: '📞', meeting: '📅', email: '✉️', meeting_outcome: '🎯' };
    return map[type] ?? '📋';
}

function DL({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm">{value ?? <span className="text-muted-foreground">—</span>}</dd>
        </div>
    );
}

export default function ShowDeal({ deal }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Opportunities', href: '/deals' },
        { title: deal.name, href: `/deals/${deal.id}` },
    ];
    const [showDelete, setShowDelete] = useState(false);

    const stageIdx = PIPELINE_STAGES.indexOf(deal.stage as typeof PIPELINE_STAGES[number]);
    const isClosedStage = ['won', 'lost', 'dnc', 'warm_email_nurture'].includes(deal.stage);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={deal.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <FlashAlert />

                {/* Header */}
                <div className="bg-card rounded-xl border p-6 shadow-xs">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                                <BriefcaseBusiness className="size-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{deal.name}</h1>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[deal.stage] ?? 'bg-muted text-muted-foreground'}`}>
                                        {stageLabel(deal.stage)}
                                    </span>
                                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                                        <DollarSign className="size-3.5" />
                                        {money.format(Number(deal.value))}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    {deal.contact && (
                                        <Link href={`/contacts/${deal.contact.id}`} className="flex items-center gap-1.5 hover:text-foreground">
                                            <UserCircle className="size-3.5" />
                                            {contactName(deal.contact)}
                                        </Link>
                                    )}
                                    {deal.account && (
                                        <Link href={`/accounts/${deal.account.id}`} className="flex items-center gap-1.5 hover:text-foreground">
                                            <Building2 className="size-3.5" />
                                            {deal.account.name}
                                        </Link>
                                    )}
                                    {deal.expected_close_date && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="size-3.5" />
                                            Close: {formatDate(deal.expected_close_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/deals/${deal.id}/edit`}>
                                    <Pencil className="mr-1 size-3.5" />Edit
                                </Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                                <Trash2 className="mr-1 size-3.5" />Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stage progress */}
                {!isClosedStage && (
                    <div className="bg-card rounded-xl border p-5 shadow-xs">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                            <TrendingUp className="size-4 text-muted-foreground" />
                            Pipeline progress
                        </h2>
                        <div className="flex items-center gap-0">
                            {PIPELINE_STAGES.map((stage, i) => {
                                const past = i < stageIdx;
                                const current = i === stageIdx;
                                return (
                                    <div key={stage} className="flex flex-1 flex-col items-center">
                                        <div className="relative flex w-full items-center">
                                            {i > 0 && <div className={`h-0.5 flex-1 ${past || current ? 'bg-emerald-500' : 'bg-muted'}`} />}
                                            <div className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${current ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-200 dark:ring-emerald-900' : past ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                {past ? <CheckCircle2 className="size-4" /> : i + 1}
                                            </div>
                                            {i < PIPELINE_STAGES.length - 1 && <div className={`h-0.5 flex-1 ${past ? 'bg-emerald-500' : 'bg-muted'}`} />}
                                        </div>
                                        <p className={`mt-2 text-center text-[10px] font-medium ${current ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                            {stageLabel(stage)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Left: deal details */}
                    <div className="space-y-5 lg:col-span-2">
                        <section className="bg-card rounded-xl border p-5 shadow-xs">
                            <h2 className="mb-4 text-sm font-semibold">Opportunity details</h2>
                            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                                <DL label="Stage" value={<span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[deal.stage] ?? 'bg-muted text-muted-foreground'}`}>{stageLabel(deal.stage)}</span>} />
                                <DL label="Value" value={<span className="font-semibold text-emerald-600">{money.format(Number(deal.value))}</span>} />
                                <DL
                                    label="Probability"
                                    value={
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                                <div className={`h-1.5 rounded-full ${probColor(deal.probability)}`} style={{ width: `${deal.probability}%` }} />
                                            </div>
                                            <span>{deal.probability}%</span>
                                        </div>
                                    }
                                />
                                <DL label="Expected close" value={formatDate(deal.expected_close_date)} />
                                <DL label="Created" value={formatDate(deal.created_at)} />
                                {deal.meeting_booked_at && <DL label="Meeting booked" value={formatDate(deal.meeting_booked_at)} />}
                                {deal.meeting_outcome && <DL label="Meeting outcome" value={<span className="capitalize">{deal.meeting_outcome.replace(/_/g, ' ')}</span>} />}
                            </dl>
                            {deal.notes && (
                                <div className="mt-4 border-t pt-4">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                                    <p className="mt-1.5 text-sm leading-relaxed">{deal.notes}</p>
                                </div>
                            )}
                            {deal.meeting_outcome_notes && (
                                <div className="mt-4 border-t pt-4">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meeting notes</p>
                                    <p className="mt-1.5 text-sm leading-relaxed">{deal.meeting_outcome_notes}</p>
                                </div>
                            )}
                        </section>

                        {/* Activities */}
                        {deal.activities.length > 0 && (
                            <section className="bg-card rounded-xl border shadow-xs">
                                <div className="border-b px-5 py-3.5">
                                    <h2 className="text-sm font-semibold">Activity</h2>
                                </div>
                                <div className="divide-y">
                                    {deal.activities.map((act) => (
                                        <div key={act.id} className="px-5 py-3">
                                            <div className="flex items-start gap-3">
                                                <span className="mt-0.5 text-lg">{activityIcon(act.type)}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">{act.subject}</p>
                                                    {act.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{act.body}</p>}
                                                </div>
                                                {act.completed_at && (
                                                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(act.completed_at)}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-5">
                        {/* Contact */}
                        <section className="bg-card rounded-xl border p-5 shadow-xs">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                <UserCircle className="size-4 text-muted-foreground" />
                                Contact
                            </h2>
                            {deal.contact ? (
                                <Link
                                    href={`/contacts/${deal.contact.id}`}
                                    className="group -mx-2 flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                        {contactName(deal.contact).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium group-hover:underline">{contactName(deal.contact)}</p>
                                        {deal.contact.job_title && <p className="text-xs text-muted-foreground">{deal.contact.job_title}</p>}
                                        {deal.contact.email && <p className="text-xs text-muted-foreground">{deal.contact.email}</p>}
                                        {deal.contact.phone && <p className="text-xs text-muted-foreground">{deal.contact.phone}</p>}
                                    </div>
                                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            ) : (
                                <div>
                                    <p className="text-xs text-muted-foreground">No contact linked.</p>
                                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                                        <Link href={`/deals/${deal.id}/edit`}>Link contact</Link>
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Account */}
                        <section className="bg-card rounded-xl border p-5 shadow-xs">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                <Building2 className="size-4 text-muted-foreground" />
                                Account
                            </h2>
                            {deal.account ? (
                                <Link
                                    href={`/accounts/${deal.account.id}`}
                                    className="group -mx-2 flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        {deal.account.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium group-hover:underline">{deal.account.name}</p>
                                        {deal.account.industry && <p className="text-xs text-muted-foreground">{deal.account.industry}</p>}
                                        {deal.account.website && <p className="text-xs text-muted-foreground">{deal.account.website.replace(/^https?:\/\//, '')}</p>}
                                    </div>
                                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            ) : (
                                <div>
                                    <p className="text-xs text-muted-foreground">No account linked.</p>
                                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                                        <Link href={`/deals/${deal.id}/edit`}>Link account</Link>
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => router.delete(`/deals/${deal.id}`, { onSuccess: () => router.visit('/deals') })}
                title={`Delete ${deal.name}?`}
                description="This opportunity will be permanently deleted and cannot be recovered."
                confirmLabel="Delete opportunity"
            />
        </AppLayout>
    );
}
