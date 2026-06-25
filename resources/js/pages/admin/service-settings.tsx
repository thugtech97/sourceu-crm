import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Trash2, Plus, X } from 'lucide-react';
import axios from 'axios';

type BusinessUnit = {
    id: number;
    name: string;
};

type Service = {
    id: number;
    business_unit_id: number;
    name: string;
};

type Props = {
    businessUnits: BusinessUnit[];
};

export default function ServiceSettingsPage({ businessUnits: initialUnits }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/users' },
        { title: 'Service Settings', href: '#' },
    ];

    const [units, setUnits] = useState<BusinessUnit[]>(initialUnits);
    const [services, setServices] = useState<Record<number, Service[]>>({});
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
    const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);
    const [newServiceName, setNewServiceName] = useState<Record<number, string>>({});

    const unitForm = useForm({
        name: '',
    });

    // Load services for a business unit when it's expanded
    useEffect(() => {
        if (expandedUnitId && !services[expandedUnitId]) {
            setLoading((prev) => ({ ...prev, [expandedUnitId]: true }));
            axios
                .get(`/business-units/${expandedUnitId}/services`)
                .then((response) => {
                    setServices((prev) => ({
                        ...prev,
                        [expandedUnitId]: response.data,
                    }));
                })
                .catch((error) => {
                    console.error('Failed to load services:', error);
                })
                .finally(() => {
                    setLoading((prev) => ({ ...prev, [expandedUnitId]: false }));
                });
        }
    }, [expandedUnitId, services]);

    const handleAddUnit = (e: FormEvent) => {
        e.preventDefault();
        unitForm.post('/business-units', {
            onSuccess: (page) => {
                const props = page.props as unknown as Props;
                setUnits(props.businessUnits);
                unitForm.reset();
                setShowAddUnitDialog(false);
            },
        });
    };

    const handleDeleteUnit = (unitId: number) => {
        if (confirm('Are you sure you want to delete this business unit? This cannot be undone.')) {
            axios
                .delete(`/business-units/${unitId}`)
                .then(() => {
                    setUnits((prev) => prev.filter((u) => u.id !== unitId));
                    setServices((prev) => {
                        const newServices = { ...prev };
                        delete newServices[unitId];
                        return newServices;
                    });
                    if (expandedUnitId === unitId) {
                        setExpandedUnitId(null);
                    }
                })
                .catch((error) => {
                    console.error('Failed to delete business unit:', error);
                    alert('Failed to delete business unit');
                });
        }
    };

    const handleAddService = (unitId: number) => {
        const name = newServiceName[unitId] || '';
        if (!name.trim()) return;

        axios
            .post('/services', {
                business_unit_id: unitId,
                name: name.trim(),
            })
            .then((response) => {
                setServices((prev) => ({
                    ...prev,
                    [unitId]: [...(prev[unitId] || []), response.data],
                }));
                setNewServiceName((prev) => ({ ...prev, [unitId]: '' }));
            })
            .catch((error) => {
                console.error('Failed to add service:', error);
                alert('Failed to add service');
            });
    };

    const handleDeleteService = (serviceId: number, unitId: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            axios
                .delete(`/services/${serviceId}`)
                .then(() => {
                    setServices((prev) => ({
                        ...prev,
                        [unitId]: prev[unitId].filter((s) => s.id !== serviceId),
                    }));
                })
                .catch((error) => {
                    console.error('Failed to delete service:', error);
                    alert('Failed to delete service');
                });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Service Settings" />

            <div className="max-w-4xl space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Service Settings</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage business units and their available services.
                    </p>
                </div>

                <Button onClick={() => setShowAddUnitDialog(true)} className="w-fit">
                    <Plus className="size-4" />
                    Add Business Unit
                </Button>

                {/* Business Units List */}
                <div className="space-y-2">
                    {units.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No business units yet. Create one to get started.
                        </p>
                    ) : (
                        units.map((unit) => (
                            <div
                                key={unit.id}
                                className="bg-card rounded-lg border shadow-xs"
                            >
                                <div className="flex items-center justify-between gap-4 p-4">
                                    <button
                                        className="flex-1 text-left"
                                        onClick={() =>
                                            setExpandedUnitId(
                                                expandedUnitId === unit.id
                                                    ? null
                                                    : unit.id,
                                            )
                                        }
                                    >
                                        <h3 className="font-semibold">{unit.name}</h3>
                                        <p className="text-muted-foreground text-xs">
                                            {services[unit.id]?.length || 0} services
                                        </p>
                                    </button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteUnit(unit.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>

                                {/* Services for this unit */}
                                {expandedUnitId === unit.id && (
                                    <div className="border-t p-4 space-y-3">
                                        {loading[unit.id] ? (
                                            <p className="text-muted-foreground text-sm">
                                                Loading services...
                                            </p>
                                        ) : (
                                            <>
                                                {/* Existing Services */}
                                                {services[unit.id] &&
                                                    services[unit.id].length > 0 && (
                                                        <div className="space-y-2">
                                                            {services[unit.id].map(
                                                                (service) => (
                                                                    <div
                                                                        key={
                                                                            service.id
                                                                        }
                                                                        className="flex items-center justify-between rounded-md bg-muted p-3"
                                                                    >
                                                                        <span className="text-sm">
                                                                            {
                                                                                service.name
                                                                            }
                                                                        </span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleDeleteService(
                                                                                    service.id,
                                                                                    unit.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <X className="size-4" />
                                                                        </Button>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* Add Service Form */}
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="New service name..."
                                                        value={
                                                            newServiceName[
                                                                unit.id
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setNewServiceName(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [unit.id]:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            ) {
                                                                handleAddService(
                                                                    unit.id,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleAddService(
                                                                unit.id,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="size-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add Business Unit Dialog */}
                <Dialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Business Unit</DialogTitle>
                            <DialogDescription>
                                Create a new business unit to organize services.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUnit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit-name">Business Unit Name</Label>
                                <Input
                                    id="unit-name"
                                    value={unitForm.data.name}
                                    onChange={(e) =>
                                        unitForm.setData('name', e.target.value)
                                    }
                                    placeholder="e.g., Enterprise Solutions"
                                    required
                                />
                                <InputError message={unitForm.errors.name} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddUnitDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={unitForm.processing}
                                >
                                    {unitForm.processing
                                        ? 'Creating...'
                                        : 'Create Unit'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
