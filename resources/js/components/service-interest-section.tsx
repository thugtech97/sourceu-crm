import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    value: {
        businessUnitId: number | null;
        chosenServiceIds: number[];
        description: string;
    };
    onChange: (value: {
        businessUnitId: number | null;
        chosenServiceIds: number[];
        description: string;
    }) => void;
    businessUnits: BusinessUnit[];
    error?: string;
};

export default function ServiceInterestSection({
    value,
    onChange,
    businessUnits: initialBusinessUnits,
    error,
}: Props) {
    const [businessUnits, setBusinessUnits] = useState(initialBusinessUnits);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Dialog states
    const [showAddBusinessUnit, setShowAddBusinessUnit] = useState(false);
    const [showAddService, setShowAddService] = useState(false);
    const [newBusinessUnitName, setNewBusinessUnitName] = useState('');
    const [newServiceName, setNewServiceName] = useState('');
    const [creatingBusinessUnit, setCreatingBusinessUnit] = useState(false);
    const [creatingService, setCreatingService] = useState(false);
    const [businessUnitError, setBusinessUnitError] = useState('');
    const [serviceError, setServiceError] = useState('');

    // Load services when business unit changes
    useEffect(() => {
        if (value.businessUnitId) {
            setLoading(true);
            axios
                .get(`/business-units/${value.businessUnitId}/services`)
                .then((response) => {
                    setAvailableServices(response.data);
                })
                .catch((error) => {
                    console.error('Failed to load services:', error);
                    setAvailableServices([]);
                })
                .finally(() => setLoading(false));
        } else {
            setAvailableServices([]);
        }
    }, [value.businessUnitId]);

    const chosenServices = availableServices.filter((s) =>
        value.chosenServiceIds.includes(s.id),
    );
    const notChosenServices = availableServices.filter(
        (s) => !value.chosenServiceIds.includes(s.id),
    );

    const handleMoveServiceToChosen = (serviceId: number) => {
        onChange({
            ...value,
            chosenServiceIds: [...value.chosenServiceIds, serviceId],
        });
    };

    const handleMoveServiceToAvailable = (serviceId: number) => {
        onChange({
            ...value,
            chosenServiceIds: value.chosenServiceIds.filter((id) => id !== serviceId),
        });
    };

    const handleSelectNotChosen = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceId = parseInt(e.target.value);
        if (serviceId && !value.chosenServiceIds.includes(serviceId)) {
            handleMoveServiceToChosen(serviceId);
        }
        e.target.value = '';
    };

    const handleSelectChosen = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceId = parseInt(e.target.value);
        if (serviceId && value.chosenServiceIds.includes(serviceId)) {
            handleMoveServiceToAvailable(serviceId);
        }
        e.target.value = '';
    };

    const handleAddBusinessUnit = async () => {
        if (!newBusinessUnitName.trim()) {
            setBusinessUnitError('Business unit name is required');
            return;
        }

        setCreatingBusinessUnit(true);
        setBusinessUnitError('');

        try {
            const response = await axios.post('/business-units', {
                name: newBusinessUnitName.trim(),
            });

            const newUnit = response.data;
            setBusinessUnits([...businessUnits, newUnit]);
            onChange({
                ...value,
                businessUnitId: newUnit.id,
                chosenServiceIds: [],
            });

            setNewBusinessUnitName('');
            setShowAddBusinessUnit(false);
        } catch (err: any) {
            setBusinessUnitError(
                err.response?.data?.message || 'Failed to create business unit',
            );
        } finally {
            setCreatingBusinessUnit(false);
        }
    };

    const handleAddService = async () => {
        if (!newServiceName.trim()) {
            setServiceError('Service name is required');
            return;
        }

        if (!value.businessUnitId) {
            setServiceError('Please select a business unit first');
            return;
        }

        setCreatingService(true);
        setServiceError('');

        try {
            const response = await axios.post('/services', {
                business_unit_id: value.businessUnitId,
                name: newServiceName.trim(),
            });

            const newService = response.data;
            setAvailableServices([...availableServices, newService]);
            onChange({
                ...value,
                chosenServiceIds: [...value.chosenServiceIds, newService.id],
            });

            setNewServiceName('');
            setShowAddService(false);
        } catch (err: any) {
            setServiceError(
                err.response?.data?.message || 'Failed to create service',
            );
        } finally {
            setCreatingService(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="business_unit_id">Business Unit</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddBusinessUnit(true)}
                        className="h-6 px-2 text-xs"
                    >
                        <Plus className="mr-1 size-3" />
                        Add
                    </Button>
                </div>
                <Select
                    value={value.businessUnitId?.toString() || 'none'}
                    onValueChange={(val) =>
                        onChange({
                            ...value,
                            businessUnitId: val !== 'none' ? parseInt(val) : null,
                            chosenServiceIds: [],
                        })
                    }
                >
                    <SelectTrigger id="business_unit_id">
                        <SelectValue placeholder="Select a business unit..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {businessUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={error} />
            </div>

            {value.businessUnitId && (
                <>
                    {/* Dual Listbox */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Services</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddService(true)}
                                className="h-6 px-2 text-xs"
                            >
                                <Plus className="mr-1 size-3" />
                                Add
                            </Button>
                        </div>
                        <div className="flex gap-3">
                            {/* Available Services */}
                            <div className="flex-1">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Available
                                </p>
                                <select
                                    value={[]}
                                    onChange={handleSelectNotChosen}
                                    disabled={loading || notChosenServices.length === 0}
                                    multiple
                                    className="border-input bg-background text-foreground placeholder-muted-foreground focus-visible:ring-ring relative flex h-40 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? (
                                        <option disabled>Loading services...</option>
                                    ) : notChosenServices.length === 0 ? (
                                        <option disabled>No services available</option>
                                    ) : (
                                        notChosenServices.map((service) => (
                                            <option
                                                key={service.id}
                                                value={service.id}
                                            >
                                                {service.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {/* Arrow Buttons */}
                            <div className="flex flex-col justify-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        const select = document.querySelector(
                                            'select[multiple]',
                                        ) as HTMLSelectElement | null;
                                        if (select) {
                                            Array.from(select.selectedOptions).forEach(
                                                (option) => {
                                                    handleMoveServiceToChosen(
                                                        parseInt(option.value),
                                                    );
                                                },
                                            );
                                        }
                                    }}
                                    disabled={notChosenServices.length === 0}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        const select = document.querySelectorAll(
                                            'select[multiple]',
                                        )[1] as HTMLSelectElement | null;
                                        if (select) {
                                            Array.from(select.selectedOptions).forEach(
                                                (option) => {
                                                    handleMoveServiceToAvailable(
                                                        parseInt(option.value),
                                                    );
                                                },
                                            );
                                        }
                                    }}
                                    disabled={chosenServices.length === 0}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                            </div>

                            {/* Chosen Services */}
                            <div className="flex-1">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Chosen
                                </p>
                                <select
                                    value={[]}
                                    onChange={handleSelectChosen}
                                    multiple
                                    className="border-input bg-background text-foreground placeholder-muted-foreground focus-visible:ring-ring relative flex h-40 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {chosenServices.length === 0 ? (
                                        <option disabled>No services chosen</option>
                                    ) : (
                                        chosenServices.map((service) => (
                                            <option
                                                key={service.id}
                                                value={service.id}
                                            >
                                                {service.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="service_description">
                            Service Interests Notes
                        </Label>
                        <textarea
                            id="service_description"
                            placeholder="Add any notes about this contact's service interests..."
                            value={value.description}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    description: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </>
            )}

            {/* Add Business Unit Dialog */}
            <Dialog open={showAddBusinessUnit} onOpenChange={setShowAddBusinessUnit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Business Unit</DialogTitle>
                        <DialogDescription>
                            Create a new business unit to organize services.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="business_unit_name">Business Unit Name</Label>
                            <Input
                                id="business_unit_name"
                                placeholder="Enter business unit name..."
                                value={newBusinessUnitName}
                                onChange={(e) => {
                                    setNewBusinessUnitName(e.target.value);
                                    setBusinessUnitError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !creatingBusinessUnit) {
                                        handleAddBusinessUnit();
                                    }
                                }}
                                disabled={creatingBusinessUnit}
                            />
                            <InputError message={businessUnitError} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddBusinessUnit(false)}
                            disabled={creatingBusinessUnit}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddBusinessUnit}
                            disabled={creatingBusinessUnit || !newBusinessUnitName.trim()}
                        >
                            {creatingBusinessUnit ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Service Dialog */}
            <Dialog open={showAddService} onOpenChange={setShowAddService}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Service</DialogTitle>
                        <DialogDescription>
                            Create a new service for this business unit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="service_name">Service Name</Label>
                            <Input
                                id="service_name"
                                placeholder="Enter service name..."
                                value={newServiceName}
                                onChange={(e) => {
                                    setNewServiceName(e.target.value);
                                    setServiceError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !creatingService) {
                                        handleAddService();
                                    }
                                }}
                                disabled={creatingService}
                            />
                            <InputError message={serviceError} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddService(false)}
                            disabled={creatingService}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddService}
                            disabled={creatingService || !newServiceName.trim()}
                        >
                            {creatingService ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
