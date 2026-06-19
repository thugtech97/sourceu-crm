import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/lib/constants/contact';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

type PoolContact = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title: string;
    notes: string;
    source_type: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    team: string;
    contact?: PoolContact | null;
};

export default function AddLeadDialog({ open, onClose, team, contact }: Props) {
    const isEditing = Boolean(contact);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
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
                notes: contact.notes ?? '',
                source_type: contact.source_type ?? Contact.SOURCE_INBOUND,
                team,
            });
        } else if (open && !contact) {
            // Reset form for new lead
            reset();
        }
    }, [open, contact, team]);

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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Lead' : 'Add Lead Manually'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update lead information.' : 'Add a new lead to the pool. Required fields are marked with *.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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

                    <div>
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

                    <div>
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
