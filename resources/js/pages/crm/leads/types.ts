export type PoolContact = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    source_type: string;
    disposition: string;
    pool_assigned_at: string | null;
    pool_expires_at: string | null;
    archived_at: string | null;
    archive_reason: string | null;
    archived_by: number | null;
    account?: { name: string } | null;
    archivedBy?: { id: number; name: string } | null;
};

export type PaginationLink = { url: string | null; label: string; active: boolean };

export type DispositionOption = {
    value: string;
    label: string;
    color: string;
    needsReason?: boolean;
    needsAccountName?: boolean;
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
};
