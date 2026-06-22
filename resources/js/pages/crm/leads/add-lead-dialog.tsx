import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/lib/constants/contact';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { PoolContact } from './types';

type Account = {
    id: number;
    name: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    team: string;
    contact?: PoolContact | null;
    accounts: Account[];
};

export default function AddLeadDialog({ open, onClose, team, contact, accounts }: Props) {
    const isEditing = Boolean(contact);
    const [selectedAccount, setSelectedAccount] = useState<string>('no-account');
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        company_name: '',
        notes: '',
        source_type: Contact.SOURCE_INBOUND,
        team,
    });

    // Populate form when dialog opens with contact data
    useEffect(() => {
        if (open && contact) {
            setData({
                first_name: contact.first_name ?? '',
                last_name: contact.last_name ?? '',
                email: contact.email ?? '',
                phone: contact.phone ?? '',
                job_title: contact.job_title ?? '',
                company_name: contact.company_name ?? '',
                notes: contact.notes ?? '',
                source_type: contact.source_type ?? Contact.SOURCE_INBOUND,
                team,
            });
            
            // Set selected account based on company_name
            if (contact.company_name) {
                const matchingAccount = accounts?.find(acc => acc.name === contact.company_name);
                if (matchingAccount) {
                    setSelectedAccount(String(matchingAccount.id));
                } else {
                    setSelectedAccount('others');
                }
            } else {
                setSelectedAccount('no-account');
            }
            setDuplicateWarning(null);
        } else if (open && !contact) {
            // Reset form for new lead
            reset();
            setSelectedAccount('no-account');
            setDuplicateWarning(null);
        }
    }, [open, contact, team]);

    const checkDuplicate = (companyName: string) => {
        if (!companyName) {
            setDuplicateWarning(null);
            return;
        }
        
        const isDuplicate = accounts?.some(acc => acc.name.toLowerCase() === companyName.toLowerCase());
        if (isDuplicate) {
            setDuplicateWarning(`"${companyName}" already exists in your accounts.`);
        } else {
            setDuplicateWarning(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditing && contact) {
            put(route('leads.pool.edit', { contact: contact.id }), {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('leads.pool.add', { team }), {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    const handleClose = () => {
        if (!processing) {
            reset();
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Lead' : 'Add Lead Manually'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update lead information.' : 'Add a new lead to the pool. Required fields are marked with *.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
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

                        <div className="col-span-2">
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

                    <div className="grid grid-cols-4 gap-4">
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
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>

                        <div className="col-span-1">
                            <Label htmlFor="job_title">Job Title</Label>
                            <Input
                                id="job_title"
                                placeholder="Sales Manager"
                                value={data.job_title}
                                onChange={(e) => setData('job_title', e.target.value)}
                                disabled={processing}
                            />
                            {errors.job_title && <p className="text-xs text-red-500 mt-1">{errors.job_title}</p>}
                        </div>

                        <div className="col-span-2">
                            <Label htmlFor="account">Account</Label>
                            <Select
                                value={selectedAccount}
                                onValueChange={(value) => {
                                    setSelectedAccount(value);
                                    if (value === 'no-account') {
                                        setData('company_name', '');
                                        setDuplicateWarning(null);
                                    } else if (value === 'others') {
                                        // Keep the current company_name for custom entry
                                    } else {
                                        // Value is an account ID
                                        const account = accounts?.find(acc => String(acc.id) === value);
                                        if (account) {
                                            setData('company_name', account.name);
                                            setDuplicateWarning(null);
                                        }
                                    }
                                }}
                                disabled={processing}
                            >
                                <SelectTrigger id="account">
                                    <SelectValue placeholder="Select an account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-account">No account</SelectItem>
                                    {accounts?.map((account) => (
                                        <SelectItem key={account.id} value={String(account.id)}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="others">Others</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {selectedAccount === 'others' && (
                            <div className="col-span-2">
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input
                                    id="company_name"
                                    placeholder="Enter company name"
                                    value={data.company_name}
                                    onChange={(e) => {
                                        setData('company_name', e.target.value);
                                        checkDuplicate(e.target.value);
                                    }}
                                    disabled={processing}
                                />
                                {duplicateWarning && <p className="text-xs text-amber-600 mt-1">⚠ {duplicateWarning}</p>}
                                {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
                            </div>
                        )}

                        <div className={selectedAccount === 'others' ? 'col-span-2' : 'col-span-4'}>
                            <Label htmlFor="source_type">Source Type</Label>
                            <Select
                                value={data.source_type}
                                onValueChange={(value) => setData('source_type', value as typeof Contact.SOURCE_INBOUND | typeof Contact.SOURCE_COLD)}
                                disabled={processing}
                            >
                                <SelectTrigger id="source_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={Contact.SOURCE_INBOUND}>Inbound</SelectItem>
                                    <SelectItem value={Contact.SOURCE_COLD}>Cold</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.source_type && <p className="text-xs text-red-500 mt-1">{errors.source_type}</p>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            placeholder="Add any additional notes..."
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            disabled={processing}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={3}
                        />
                        {errors.notes && <p className="text-xs text-red-500 mt-1">{errors.notes}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Lead' : 'Add Lead')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
