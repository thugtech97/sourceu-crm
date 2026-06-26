import { type LeadFieldDef } from '@/components/leads/custom-field-renderer';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { LeadFormFields, type LeadForm, type LeadFormSetData } from './create';

type SalesRep = { id: number; name: string };
type FieldValue = { lead_field_id: string; value: string | null };

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
    assigned_to: number | null;
    follow_up_due_at: string | null;
    interest_area: string | null;
    pain_points: string | null;
    competitor_mention: string | null;
    initial_notes: string | null;
    bant_budget: string | null;
    bant_budget_amount: string | null;
    bant_authority: string | null;
    bant_need: string | null;
    bant_need_score: string | null;
    bant_timeline: string | null;
    field_values: FieldValue[];
};

type Props = { lead: Lead; salesReps: SalesRep[]; customFields: LeadFieldDef[] };

export default function EditLead({ lead, salesReps, customFields }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/leads' },
        { title: lead.name, href: `/leads/${lead.id}` },
        { title: 'Edit', href: `/leads/${lead.id}/edit` },
    ];

    const existingCustomFields: Record<string, string> = {};
    for (const fv of lead.field_values ?? []) {
        existingCustomFields[fv.lead_field_id] = fv.value ?? '';
    }

    const { data, setData, patch, processing, errors } = useForm<LeadForm>({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone ?? '',
        linkedin_url: lead.linkedin_url ?? '',
        job_title: lead.job_title ?? '',
        seniority_level: lead.seniority_level ?? '',
        company_name: lead.company_name ?? '',
        industry: lead.industry ?? '',
        company_size: lead.company_size ?? '',
        annual_revenue: lead.annual_revenue ?? '',
        company_website: lead.company_website ?? '',
        country: lead.country ?? '',
        region: lead.region ?? '',
        source_type: lead.source_type,
        source_campaign: lead.source_campaign ?? '',
        source_url: lead.source_url ?? '',
        status: lead.status,
        priority: lead.priority,
        assigned_to: lead.assigned_to ? String(lead.assigned_to) : '',
        follow_up_due_at: lead.follow_up_due_at ? lead.follow_up_due_at.substring(0, 10) : '',
        interest_area: lead.interest_area ?? '',
        pain_points: lead.pain_points ?? '',
        competitor_mention: lead.competitor_mention ?? '',
        initial_notes: lead.initial_notes ?? '',
        bant_budget: lead.bant_budget ?? '',
        bant_budget_amount: lead.bant_budget_amount ?? '',
        bant_authority: lead.bant_authority ?? '',
        bant_need: lead.bant_need ?? '',
        bant_need_score: lead.bant_need_score ?? '',
        bant_timeline: lead.bant_timeline ?? '',
        custom_fields: existingCustomFields,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        patch(`/leads/${lead.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${lead.name}`} />
            <form onSubmit={submit} className="flex flex-1 flex-col">
                <LeadFormFields
                    data={data}
                    setData={setData as LeadFormSetData}
                    errors={errors}
                    salesReps={salesReps}
                    customFields={customFields}
                    processing={processing}
                    submitLabel="Save changes"
                    cancelHref={`/leads/${lead.id}`}
                    pageTitle={`Edit — ${lead.name}`}
                />
            </form>
        </AppLayout>
    );
}
