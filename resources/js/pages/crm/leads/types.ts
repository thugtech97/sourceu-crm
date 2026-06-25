export type PoolContact = {
    id: number;
    name: string;
    // Name fields
    first_name: string | null;
    salutation: string | null;
    middle_name: string | null;
    last_name: string | null;
    suffix: string | null;
    title: string | null;
    // Account / company
    account_id: number | null;
    company_name: string | null;
    account?: { id: number; name: string } | null;
    // Contact info
    email: string | null;
    phone: string | null;
    mobile: string | null;
    other_phone: string | null;
    // Role / industry / business type / lead source (FK + name fallbacks)
    role_id: number | null;
    industry_id: number | null;
    business_type_id: number | null;
    lead_source_id: number | null;
    role?: string | null;
    industry?: string | null;
    business_type?: string | null;
    lead_source?: string | null;
    lead_owner?: string | null;
    // Company details
    employee_size?: string | null;
    linkedin?: string | null;
    position_applied?: string | null;
    last_company?: string | null;
    gender_identity?: string | null;
    // Address
    street?: string | null;
    city?: string | null;
    state_province?: string | null;
    zip_postal_code?: string | null;
    country?: string | null;
    // Lead status
    lead_status?: string | null;
    reason_not_qualified?: string | null;
    estimated_value?: string | null;
    // Service interests (stored as comma-separated IDs)
    business_unit?: string | null;
    services?: string | null;
    service_description?: string | null;
    // NDIS fields
    ndis_funding?: string | null;
    client_with_complex_needs?: boolean;
    sm_field_ndis_funding?: string | null;
    ndis_accommodation?: string | null;
    region_territory?: string | null;
    are_you_in_the_area?: boolean;
    are_you_in_merrylands?: boolean;
    are_you_in_pacific_pines?: boolean;
    // Other
    notes?: string | null;
    source_type: string;
    disposition: string;
    job_title: string | null;
    pool_assigned_at: string | null;
    pool_expires_at: string | null;
    archived_at: string | null;
    archive_reason: string | null;
    archived_by: number | null;
    archivedBy?: { id: number; name: string } | null;
};

export type PaginationLink = { url: string | null; label: string; active: boolean };

export type DispositionOption = {
    value: string;
    label: string;
    color: string;
    needsReason?: boolean;
    needsAccountName?: boolean;
    needsArchiveReason?: boolean;
};

export type CallTranscript = {
    id: number;
    dialpad_call_id: string;
    status: string;
    direction: string;
    duration_seconds: number;
    transcript_text: string;
    recording_url: string | null;
    started_at: string;
    ended_at: string;
    user_name: string;
};

export type LeadPoolProps = {
    pool: { data: PoolContact[]; links: PaginationLink[] };
    myLeads: { data: PoolContact[]; links: PaginationLink[] };
    archived: { data: PoolContact[]; links: PaginationLink[] };
    team: string;
    teams: { value: string; label: string }[];
    accounts: { id: number; name: string }[];
    businessUnits: { id: number; name: string }[];
};
