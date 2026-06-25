import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ServiceInterestSection from '@/components/service-interest-section';
import { useForm, router as inertiaRouter } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { PoolContact } from './types';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';

type Account = {
    id: number;
    name: string;
};

type BusinessUnit = {
    id: number;
    name: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    team: string;
    contact?: PoolContact | null;
    accounts: Account[];
    businessUnits: BusinessUnit[];
    onSuccess?: (message: string) => void;
};

export default function AddLeadDialog({ open, onClose, team, contact, accounts, businessUnits, onSuccess }: Props) {
    const isEditing = Boolean(contact);
    const [accountSearch, setAccountSearch] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    // Service Interests state
    const [serviceInterests, setServiceInterests] = useState({
        businessUnitId: null as number | null,
        chosenServiceIds: [] as number[],
        description: '',
    });

    // Role autocomplete state
    const [roleSearch, setRoleSearch] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

    // Industry autocomplete state
    const [industrySearch, setIndustrySearch] = useState('');
    const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);

    // Business Type autocomplete state
    const [businessTypeSearch, setBusinessTypeSearch] = useState('');
    const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState<number | null>(null);

    // Lead Source autocomplete state
    const [leadSourceSearch, setLeadSourceSearch] = useState('');
    const [selectedLeadSourceId, setSelectedLeadSourceId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { data, setData, processing, errors, setError, clearErrors, reset } = useForm({
        // Account
        account_id: '',
        account_name: '',
        // Lead Information
        first_name: '',
        salutation: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        title: '',
        role_id: '',
        role_name: '',
        company_name: '',
        industry_id: '',
        industry_name: '',
        business_type_id: '',
        business_type_name: '',
        lead_source_id: '',
        lead_source_name: '',
        employee_size: '',
        linkedin: '',
        position_applied: '',
        last_company: '',
        gender_identity: '',
        lead_source: '',
        lead_owner: '',
        business_unit: '',
        services: '',
        service_description: '',
        // Contact Information
        email: '',
        phone: '',
        mobile: '',
        other_phone: '',
        // Address Information
        street: '',
        city: '',
        state_province: '',
        zip_postal_code: '',
        country: '',
        // Lead Status & Score
        lead_status: 'new',
        reason_not_qualified: '',
        estimated_value: '',
        // NDIS Fields
        ndis_funding: '',
        client_with_complex_needs: false as boolean,
        sm_field_ndis_funding: '',
        ndis_accommodation: '',
        region_territory: '',
        are_you_in_the_area: false as boolean,
        are_you_in_merrylands: false as boolean,
        are_you_in_pacific_pines: false as boolean,
        // Other
        notes: '',
        team,
    });

    // Populate form when dialog opens with contact data
    useEffect(() => {
        if (open && contact) {
            setData({
                account_id: contact.account_id?.toString() ?? '',
                account_name: '',
                first_name: contact.first_name ?? '',
                salutation: contact.salutation ?? '',
                middle_name: contact.middle_name ?? '',
                last_name: contact.last_name ?? '',
                suffix: contact.suffix ?? '',
                title: contact.title ?? '',
                role_id: contact.role_id?.toString() ?? '',
                role_name: '',
                company_name: contact.company_name ?? '',
                industry_id: contact.industry_id?.toString() ?? '',
                industry_name: '',
                business_type_id: contact.business_type_id?.toString() ?? '',
                business_type_name: '',
                lead_source_id: contact.lead_source_id?.toString() ?? '',
                lead_source_name: '',
                employee_size: contact.employee_size ?? '',
                linkedin: contact.linkedin ?? '',
                position_applied: contact.position_applied ?? '',
                last_company: contact.last_company ?? '',
                gender_identity: contact.gender_identity ?? '',
                lead_source: contact.lead_source ?? '',
                lead_owner: contact.lead_owner ?? '',
                business_unit: contact.business_unit ?? '',
                services: contact.services ?? '',
                service_description: contact.service_description ?? '',
                email: contact.email ?? '',
                phone: contact.phone ?? '',
                mobile: contact.mobile ?? '',
                other_phone: contact.other_phone ?? '',
                street: contact.street ?? '',
                city: contact.city ?? '',
                state_province: contact.state_province ?? '',
                zip_postal_code: contact.zip_postal_code ?? '',
                country: contact.country ?? '',
                lead_status: contact.lead_status ?? 'new',
                reason_not_qualified: contact.reason_not_qualified ?? '',
                estimated_value: contact.estimated_value ?? '',
                ndis_funding: contact.ndis_funding ?? '',
                client_with_complex_needs: contact.client_with_complex_needs ?? false,
                sm_field_ndis_funding: contact.sm_field_ndis_funding ?? '',
                ndis_accommodation: contact.ndis_accommodation ?? '',
                region_territory: contact.region_territory ?? '',
                are_you_in_the_area: contact.are_you_in_the_area ?? false,
                are_you_in_merrylands: contact.are_you_in_merrylands ?? false,
                are_you_in_pacific_pines: contact.are_you_in_pacific_pines ?? false,
                notes: contact.notes ?? '',
                team,
            });

            // Set selected account — check both the accounts prop list and the eagerly-loaded account relation
            if (contact.account_id) {
                const matchingAccount =
                    accounts?.find((acc) => acc.id === contact.account_id) ??
                    (contact.account ? { id: contact.account_id, name: contact.account.name } : null);
                if (matchingAccount) {
                    setAccountSearch(matchingAccount.name);
                    setSelectedAccountId(contact.account_id);
                }
            }

            // Initialize role, industry, business type states with actual values
            setRoleSearch(contact.role ?? '');
            setSelectedRoleId(contact.role_id ?? null);

            setIndustrySearch(contact.industry ?? '');
            setSelectedIndustryId(contact.industry_id ?? null);

            setBusinessTypeSearch(contact.business_type ?? '');
            setSelectedBusinessTypeId(contact.business_type_id ?? null);

            setLeadSourceSearch(contact.lead_source ?? '');
            setSelectedLeadSourceId(contact.lead_source_id ?? null);

            // Parse business unit: stored as string ID in DB (e.g. "3").
            // Fall back to name-lookup for legacy data where the BU name was stored instead.
            let parsedBusinessUnitId: number | null = null;
            if (contact.business_unit) {
                const parsed = Number.parseInt(contact.business_unit, 10);
                if (Number.isFinite(parsed)) {
                    parsedBusinessUnitId = parsed;
                } else {
                    // Legacy: business_unit stored as a name — look up by name
                    const match = businessUnits.find(
                        (bu) => bu.name.toLowerCase() === contact.business_unit?.toLowerCase()
                    );
                    parsedBusinessUnitId = match?.id ?? null;
                }
            }

            const parsedServiceIds = (contact.services ?? '')
                .split(',')
                .map((serviceId) => Number.parseInt(serviceId.trim(), 10))
                .filter((id) => Number.isFinite(id));

            setServiceInterests({
                businessUnitId: parsedBusinessUnitId,
                chosenServiceIds: parsedServiceIds,
                description: contact.service_description ?? '',
            });
        } else if (open && !contact) {
            // Reset form for new lead
            reset();
            setAccountSearch('');
            setSelectedAccountId(null);

            // Reset new autocomplete fields
            setRoleSearch('');
            setSelectedRoleId(null);

            setIndustrySearch('');
            setSelectedIndustryId(null);

            setBusinessTypeSearch('');
            setSelectedBusinessTypeId(null);

            setLeadSourceSearch('');
            setSelectedLeadSourceId(null);

            // Reset service interests
            setServiceInterests({
                businessUnitId: null,
                chosenServiceIds: [],
                description: '',
            });
        }
    }, [open, contact, team]);

    const isBusy = processing || submitting;

    const handleSubmit = async (e?: React.SyntheticEvent) => {
        e?.preventDefault();
        if (isBusy) {
            return;
        }
        setSubmitting(true);
        clearErrors();

        // Prepare the complete form data with service interests
        const submissionData = {
            ...data,
            business_unit: serviceInterests.businessUnitId ? serviceInterests.businessUnitId.toString() : '',
            services: serviceInterests.chosenServiceIds.length > 0
                ? serviceInterests.chosenServiceIds.join(',')
                : '',
            service_description: serviceInterests.description || '',
        };

        // Validate required fields before submission
        const validationErrors: Record<string, string> = {};
        if (!submissionData.first_name?.trim()) {
            validationErrors.first_name = 'First name is required';
        }
        if (!submissionData.last_name?.trim()) {
            validationErrors.last_name = 'Last name is required';
        }
        if (!submissionData.lead_status) {
            validationErrors.lead_status = 'Lead status is required';
        }
        if (!submissionData.account_id && !submissionData.account_name) {
            validationErrors.account_id = 'Account is required (either select existing or create new)';
        }

        if (Object.keys(validationErrors).length > 0) {
            setError(validationErrors as any);
            setSubmitting(false);
            return;
        }

        try {
            let url: string;
            let method: 'post' | 'put';

            if (isEditing) {
                if (!contact?.id) {
                    throw new Error('Missing contact id for edit mode');
                }
                url = `/leads/pool/${contact.id}/edit`;
                method = 'put';
            } else {
                if (!team) {
                    throw new Error('Team parameter is empty/undefined');
                }
                url = `/leads/pool/add?team=${encodeURIComponent(team)}`;
                method = 'post';
            }

            const response = await axios({
                method: method,
                url: url,
                data: submissionData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? ''
                    ),
                },
                maxRedirects: 0,      // Prevent Axios following 302s that cause 405
                validateStatus: () => true, // Don't throw on any status code
            });

            if (response.status === 200 || response.status === 302) {
                // Success
                const successMsg = isEditing ? 'Lead updated successfully!' : 'Lead added successfully!';

                reset();
                setServiceInterests({ businessUnitId: null, chosenServiceIds: [], description: '' });
                onClose();

                if (onSuccess) {
                    onSuccess(successMsg);
                } else {
                    alert('✅ ' + successMsg);
                }

                // Reload Inertia page to reflect changes in the lead list
                inertiaRouter.reload({ preserveScroll: true } as any);

            } else if (response.status === 422) {
                // Validation error
                const validationErrors = response.data?.errors || response.data;
                const mappedErrors: Record<string, string> = {};
                Object.entries(validationErrors).forEach(([field, messages]: [string, any]) => {
                    const msg = Array.isArray(messages) ? messages.join(', ') : messages;
                    mappedErrors[field] = msg;
                });

                setError(mappedErrors as any);

            } else if (response.status === 500) {
                setError({
                    server: `Server error: ${response.data?.message || 'Unknown error'}`
                } as any);

            } else {
                setError({
                    server: `Error (${response.status}): ${response.data?.message || response.statusText || 'Unknown error'}`
                } as any);
            }

        } catch (error: any) {
            setError({
                server: `An error occurred: ${error.message}`
            } as any);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isBusy) {
            reset();
            setAccountSearch('');
            setSelectedAccountId(null);

            setRoleSearch('');
            setSelectedRoleId(null);

            setIndustrySearch('');
            setSelectedIndustryId(null);

            setBusinessTypeSearch('');
            setSelectedBusinessTypeId(null);

            setLeadSourceSearch('');
            setSelectedLeadSourceId(null);

            // Reset service interests
            setServiceInterests({
                businessUnitId: null,
                chosenServiceIds: [],
                description: '',
            });

            onClose();
        }
    };

    // Prevent closing by clicking outside - only close on explicit button/X click
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && isBusy) {
            return; // Don't close while processing
        }
        if (!newOpen) {
            handleClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 gap-0 rounded-none overflow-hidden flex flex-col [&>button]:hidden">
                {/* Fixed Header */}
                <div className="border-b bg-white px-6 py-4 flex-shrink-0 relative">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <DialogTitle className="text-2xl font-bold">{isEditing ? '✏️ Edit Lead' : '➕ Add New Lead'}</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground mt-1">
                                    {isEditing ? 'Update lead information.' : 'Add a new lead to the pool. Required fields are marked with *.'}
                                </DialogDescription>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isBusy}
                                className="absolute right-4 top-4 inline-flex items-center justify-center w-10 h-10 rounded-md transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Close dialog"
                            >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>
                    </DialogHeader>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <form id="lead-form" onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
                        <fieldset disabled={isBusy}>
                            {/* Validation Error Alert */}
                            {Object.keys(errors).length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                    <h4 className="font-semibold text-red-800 mb-2">Please fix the following errors:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {Object.entries(errors).map(([field, message]) => (
                                            <li key={field} className="text-sm text-red-700">
                                                {field === 'server' || field === 'global' ? (
                                                    <span>{message}</span>
                                                ) : (
                                                    <>
                                                        <strong className="capitalize">{field.replace(/_/g, ' ')}:</strong> {message}
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {/* Account Section - At the top */}
                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-indigo-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Account</h3>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <AutocompleteInput
                                        id="account"
                                        label="Account"
                                        placeholder="Search or type account name..."
                                        searchUrl="/accounts/search"
                                        selectedId={selectedAccountId}
                                        searchText={accountSearch}
                                        onSearchTextChange={(val) => {
                                            setAccountSearch(val);
                                            if (!val.trim()) {
                                                setSelectedAccountId(null);
                                                setData('account_id', '');
                                                setData('account_name', '');
                                            }
                                        }}
                                        onSelect={(item) => {
                                            setAccountSearch(item.name);
                                            setSelectedAccountId(item.id);
                                            setData('account_id', String(item.id));
                                            setData('account_name', '');
                                        }}
                                        onCreateNew={(name) => {
                                            setSelectedAccountId(null);
                                            setData('account_id', '');
                                            setData('account_name', name);
                                        }}
                                        error={errors.account_id}
                                        disabled={processing}
                                        required={true}
                                        className="col-span-4"
                                    />
                                </div>
                            </div>

                            {/* Lead Information Section */}
                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-blue-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Lead Information</h3>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <Label htmlFor="salutation">Salutation</Label>
                                        <Select value={data.salutation} onValueChange={(value) => setData('salutation', value)} disabled={processing}>
                                            <SelectTrigger id="salutation">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mr">Mr</SelectItem>
                                                <SelectItem value="Ms">Ms</SelectItem>
                                                <SelectItem value="Mrs">Mrs</SelectItem>
                                                <SelectItem value="Dr">Dr</SelectItem>
                                                <SelectItem value="Prof">Prof</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="first_name">First Name *</Label>
                                        <Input
                                            id="first_name"
                                            placeholder="John"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            disabled={processing}
                                            className={errors.first_name ? 'border-red-500' : ''}
                                        />
                                        {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input
                                            id="middle_name"
                                            placeholder="Middle"
                                            value={data.middle_name}
                                            onChange={(e) => setData('middle_name', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_name">Last Name *</Label>
                                        <Input
                                            id="last_name"
                                            placeholder="Doe"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            disabled={processing}
                                            className={errors.last_name ? 'border-red-500' : ''}
                                        />
                                        {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <Label htmlFor="suffix">Suffix</Label>
                                        <Input
                                            id="suffix"
                                            placeholder="Jr, Sr, III"
                                            value={data.suffix}
                                            onChange={(e) => setData('suffix', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="VP Sales"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <AutocompleteInput
                                        id="role"
                                        label="Role"
                                        placeholder="Search roles..."
                                        searchUrl="/roles/search"
                                        selectedId={selectedRoleId}
                                        searchText={roleSearch}
                                        onSearchTextChange={(val) => {
                                            setRoleSearch(val);
                                            if (!val.trim()) {
                                                setSelectedRoleId(null);
                                                setData('role_id', '');
                                                setData('role_name', '');
                                            }
                                        }}
                                        onSelect={(item) => {
                                            setRoleSearch(item.name);
                                            setSelectedRoleId(item.id);
                                            setData('role_id', String(item.id));
                                            setData('role_name', '');
                                        }}
                                        onCreateNew={(name) => {
                                            setSelectedRoleId(null);
                                            setData('role_id', '');
                                            setData('role_name', name);
                                        }}
                                        error={errors.role_id}
                                        disabled={processing}
                                    />
                                    <AutocompleteInput
                                        id="industry"
                                        label="Industry"
                                        placeholder="Search industries..."
                                        searchUrl="/industries/search"
                                        selectedId={selectedIndustryId}
                                        searchText={industrySearch}
                                        onSearchTextChange={(val) => {
                                            setIndustrySearch(val);
                                            if (!val.trim()) {
                                                setSelectedIndustryId(null);
                                                setData('industry_id', '');
                                                setData('industry_name', '');
                                            }
                                        }}
                                        onSelect={(item) => {
                                            setIndustrySearch(item.name);
                                            setSelectedIndustryId(item.id);
                                            setData('industry_id', String(item.id));
                                            setData('industry_name', '');
                                        }}
                                        onCreateNew={(name) => {
                                            setSelectedIndustryId(null);
                                            setData('industry_id', '');
                                            setData('industry_name', name);
                                        }}
                                        error={errors.industry_id}
                                        disabled={processing}
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-4">

                                    <AutocompleteInput
                                        id="business_type"
                                        label="Business Type"
                                        placeholder="Search business types..."
                                        searchUrl="/business-types/search"
                                        selectedId={selectedBusinessTypeId}
                                        searchText={businessTypeSearch}
                                        onSearchTextChange={(val) => {
                                            setBusinessTypeSearch(val);
                                            if (!val.trim()) {
                                                setSelectedBusinessTypeId(null);
                                                setData('business_type_id', '');
                                                setData('business_type_name', '');
                                            }
                                        }}
                                        onSelect={(item) => {
                                            setBusinessTypeSearch(item.name);
                                            setSelectedBusinessTypeId(item.id);
                                            setData('business_type_id', String(item.id));
                                            setData('business_type_name', '');
                                        }}
                                        onCreateNew={(name) => {
                                            setSelectedBusinessTypeId(null);
                                            setData('business_type_id', '');
                                            setData('business_type_name', name);
                                        }}
                                        error={errors.business_type_id}
                                        disabled={processing}
                                    />

                                    <div>
                                        <Label htmlFor="gender_identity">Gender Identity</Label>
                                        <Select
                                            value={data.gender_identity}
                                            onValueChange={(value) => setData('gender_identity', value)}
                                            disabled={processing}
                                        >
                                            <SelectTrigger id="gender_identity">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="non-binary">Non-binary</SelectItem>
                                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="lead_owner">Lead Owner</Label>
                                        <Input
                                            id="lead_owner"
                                            placeholder="Lead Owner"
                                            value={data.lead_owner}
                                            onChange={(e) => setData('lead_owner', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="linkedin">LinkedIn</Label>
                                        <Input
                                            id="linkedin"
                                            placeholder="LinkedIn URL"
                                            value={data.linkedin}
                                            onChange={(e) => setData('linkedin', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">

                                    <div>
                                        <Label htmlFor="other_phone">Other Phone</Label>
                                        <Input
                                            id="other_phone"
                                            type="tel"
                                            placeholder="Other phone"
                                            value={data.other_phone}
                                            onChange={(e) => setData('other_phone', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="position_applied">Position Applied</Label>
                                        <Input
                                            id="position_applied"
                                            placeholder="Position"
                                            value={data.position_applied}
                                            onChange={(e) => setData('position_applied', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_company">Last Company</Label>
                                        <Input
                                            id="last_company"
                                            placeholder="Company Name"
                                            value={data.last_company}
                                            onChange={(e) => setData('last_company', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                    <AutocompleteInput
                                        id="lead_source"
                                        label="Lead Source"
                                        placeholder="Search or create..."
                                        searchUrl="/lead-sources/search"
                                        selectedId={selectedLeadSourceId}
                                        searchText={leadSourceSearch}
                                        onSearchTextChange={(val) => {
                                            setLeadSourceSearch(val);
                                            if (!val.trim()) {
                                                setSelectedLeadSourceId(null);
                                                setData('lead_source_id', '');
                                                setData('lead_source_name', '');
                                            }
                                        }}
                                        onSelect={(item) => {
                                            setLeadSourceSearch(item.name);
                                            setSelectedLeadSourceId(item.id);
                                            setData('lead_source_id', String(item.id));
                                            setData('lead_source_name', '');
                                        }}
                                        onCreateNew={(name) => {
                                            setSelectedLeadSourceId(null);
                                            setData('lead_source_id', '');
                                            setData('lead_source_name', name);
                                        }}
                                        error={errors.lead_source_id}
                                        disabled={processing}
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <Label htmlFor="employee_size">Employee Size</Label>
                                        <Input
                                            id="employee_size"
                                            placeholder="e.g., 1-10, 50-100, 500+"
                                            value={data.employee_size}
                                            onChange={(e) => setData('employee_size', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">Notes</Label>
                                        <Input
                                            id="notes"
                                            placeholder="Add any additional notes..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            disabled={processing}
                                        />
                                        {errors.notes && <p className="text-xs text-red-500 mt-1">{errors.notes}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information Section */}
                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-green-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Contact Information</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+1 (555) 123-4567"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="mobile">Mobile</Label>
                                        <Input
                                            id="mobile"
                                            type="tel"
                                            placeholder="+1 (555) 987-6543"
                                            value={data.mobile}
                                            onChange={(e) => setData('mobile', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            disabled={processing}
                                            className={errors.email ? 'border-red-500' : ''}
                                        />
                                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Address Information Section */}
                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-purple-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Address Information</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-4">
                                        <Label htmlFor="street">Street</Label>
                                        <Input
                                            id="street"
                                            placeholder="Street address"
                                            value={data.street}
                                            onChange={(e) => setData('street', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="City"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="state_province">State/Province</Label>
                                        <Input
                                            id="state_province"
                                            placeholder="State"
                                            value={data.state_province}
                                            onChange={(e) => setData('state_province', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="zip_postal_code">Zip/Postal Code</Label>
                                        <Input
                                            id="zip_postal_code"
                                            placeholder="Postal code"
                                            value={data.zip_postal_code}
                                            onChange={(e) => setData('zip_postal_code', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            placeholder="Country"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Score Section */}
                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-pink-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Lead Score</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="estimated_value">Estimated Value</Label>
                                        <Input
                                            id="estimated_value"
                                            type="number"
                                            placeholder="0.00"
                                            value={data.estimated_value}
                                            onChange={(e) => setData('estimated_value', e.target.value)}
                                            disabled={processing}
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lead Status  */}
                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-orange-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Lead Status</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>

                                        <Label htmlFor="lead_status">Lead Status *</Label>
                                        <Select
                                            value={data.lead_status || 'new'}
                                            onValueChange={(value) => setData('lead_status', value)}
                                            disabled={processing}
                                        >
                                            <SelectTrigger id="lead_status">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="unqualified">Unqualified</SelectItem>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="working">Working</SelectItem>
                                                <SelectItem value="nurturing">Nurturing</SelectItem>
                                                <SelectItem value="qualified">Qualified</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {errors.lead_status && <p className="text-xs text-red-500 mt-1">{errors.lead_status}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="reason_not_qualified">Reason Not Qualified</Label>
                                        <Input
                                            id="reason_not_qualified"
                                            placeholder="Reason"
                                            value={data.reason_not_qualified}
                                            onChange={(e) => setData('reason_not_qualified', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-red-500 rounded"></div>
                                    <h3 className="font-bold text-lg">NDIS Lead Qualification</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <Label htmlFor="ndis_funding">NDIS Funding</Label>
                                        <Select
                                            value={data.ndis_funding || 'new'}
                                            onValueChange={(value) => setData('ndis_funding', value)}
                                            disabled={processing}
                                        >
                                            <SelectTrigger id="ndis_funding">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="region_territory">Region/Territory</Label>
                                        <Input
                                            id="region_territory"
                                            placeholder="Territory"
                                            value={data.region_territory}
                                            onChange={(e) => setData('region_territory', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="sm_field_ndis_funding">SM Field - NDIS Funding</Label>
                                        <Input
                                            id="sm_field_ndis_funding"
                                            placeholder="SM Field"
                                            value={data.sm_field_ndis_funding}
                                            onChange={(e) => setData('sm_field_ndis_funding', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="client_with_complex_needs"
                                            type="checkbox"
                                            checked={data.client_with_complex_needs}
                                            onChange={(e) => setData('client_with_complex_needs', e.target.checked)}
                                            disabled={processing}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="client_with_complex_needs" className="mb-0">Do You Have A Client With Complex Needs</Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="are_you_in_the_area"
                                            type="checkbox"
                                            checked={data.are_you_in_the_area}
                                            onChange={(e) => setData('are_you_in_the_area', e.target.checked)}
                                            disabled={processing}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="are_you_in_the_area" className="mb-0">Are You In The Area</Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="are_you_in_merrylands"
                                            type="checkbox"
                                            checked={data.are_you_in_merrylands}
                                            onChange={(e) => setData('are_you_in_merrylands', e.target.checked)}
                                            disabled={processing}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="are_you_in_merrylands" className="mb-0">Are You In Merrylands</Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="are_you_in_pacific_pines"
                                            type="checkbox"
                                            checked={data.are_you_in_pacific_pines}
                                            onChange={(e) => setData('are_you_in_pacific_pines', e.target.checked)}
                                            disabled={processing}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="are_you_in_pacific_pines" className="mb-0">Are You In Pacific Pines</Label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-4">
                                        <Label htmlFor="ndis_accommodation">NDIS Accommodation</Label>
                                        <textarea
                                            id="ndis_accommodation"
                                            placeholder="Accommodation details"
                                            value={data.ndis_accommodation}
                                            onChange={(e) => setData('ndis_accommodation', e.target.value)}
                                            disabled={processing}
                                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Service Interests */}
                            <div className="pb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-red-500 rounded"></div>
                                    <h3 className="font-bold text-lg">Service Interests</h3>
                                </div>
                                <ServiceInterestSection
                                    value={serviceInterests}
                                    onChange={setServiceInterests}
                                    businessUnits={businessUnits}
                                />
                            </div>
                        </fieldset>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="border-t bg-white px-6 py-4 flex-shrink-0">
                    <DialogFooter className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isBusy}
                            className="px-6"
                        >
                            ✕ Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isBusy}
                            className="px-6 bg-blue-600 hover:bg-blue-700"
                        >
                            {processing ? (isEditing ? '⏳ Updating...' : '⏳ Adding...') : (isEditing ? '💾 Update Lead' : '➕ Add Lead')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
