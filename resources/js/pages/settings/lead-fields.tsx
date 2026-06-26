import FlashAlert from '@/components/flash-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Lead Fields', href: '/settings/lead-fields' }];

const FIELD_TYPES = [
    'text',
    'email',
    'phone',
    'url',
    'number',
    'currency',
    'date',
    'select',
    'textarea',
    'toggle',
    'score',
] as const;

type FieldType = (typeof FIELD_TYPES)[number];

type LeadField = {
    id: string;
    section: string;
    label: string;
    key: string;
    type: FieldType;
    options: string[] | null;
    placeholder: string | null;
    required: boolean;
    show_on_list: boolean;
    sort_order: number;
    is_active: boolean;
};

type FormValues = {
    section: string;
    label: string;
    key: string;
    type: FieldType;
    options: string[];
    placeholder: string;
    required: boolean;
    show_on_list: boolean;
    sort_order: number;
    is_active: boolean;
};

const emptyForm: FormValues = {
    section: '',
    label: '',
    key: '',
    type: 'text',
    options: [],
    placeholder: '',
    required: false,
    show_on_list: false,
    sort_order: 0,
    is_active: true,
};

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function FieldForm({
    initial,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    initial: FormValues;
    onSubmit: (values: FormValues) => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    const { data, setData, errors, setError, clearErrors } = useForm<FormValues>(initial);
    const [optionInput, setOptionInput] = useState('');

    function addOption() {
        const trimmed = optionInput.trim();
        if (!trimmed || data.options.includes(trimmed)) {
            return;
        }
        setData('options', [...data.options, trimmed]);
        setOptionInput('');
    }

    function removeOption(opt: string) {
        setData(
            'options',
            data.options.filter((o) => o !== opt),
        );
    }

    function handleLabelChange(value: string) {
        setData((prev) => ({
            ...prev,
            label: value,
            key: prev.key === '' || prev.key === slugify(prev.label) ? slugify(value) : prev.key,
        }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        clearErrors();
        if (!data.section.trim()) {
            setError('section', 'Section is required');
            return;
        }
        if (!data.label.trim()) {
            setError('label', 'Label is required');
            return;
        }
        if (!data.key.trim()) {
            setError('key', 'Key is required');
            return;
        }
        onSubmit(data);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label htmlFor="section">Section</Label>
                    <Input
                        id="section"
                        value={data.section}
                        onChange={(e) => setData('section', e.target.value)}
                        placeholder="e.g. qualification"
                    />
                    {errors.section && <p className="text-destructive text-xs">{errors.section}</p>}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="label">Label</Label>
                    <Input id="label" value={data.label} onChange={(e) => handleLabelChange(e.target.value)} placeholder="e.g. Decision Deadline" />
                    {errors.label && <p className="text-destructive text-xs">{errors.label}</p>}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="key">Key</Label>
                    <Input
                        id="key"
                        value={data.key}
                        onChange={(e) => setData('key', slugify(e.target.value))}
                        placeholder="e.g. decision_deadline"
                    />
                    {errors.key && <p className="text-destructive text-xs">{errors.key}</p>}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="type">Type</Label>
                    <Select value={data.type} onValueChange={(v) => setData('type', v as FieldType)}>
                        <SelectTrigger id="type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FIELD_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="placeholder">Placeholder</Label>
                    <Input
                        id="placeholder"
                        value={data.placeholder}
                        onChange={(e) => setData('placeholder', e.target.value)}
                        placeholder="Optional hint text"
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="sort_order">Sort order</Label>
                    <Input
                        id="sort_order"
                        type="number"
                        min={0}
                        value={data.sort_order}
                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>

            {data.type === 'select' && (
                <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex gap-2">
                        <Input
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addOption();
                                }
                            }}
                            placeholder="Add option and press Enter"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {data.options.map((opt) => (
                            <Badge key={opt} variant="secondary" className="gap-1">
                                {opt}
                                <button type="button" onClick={() => removeOption(opt)} className="hover:text-destructive">
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={data.required} onCheckedChange={(v) => setData('required', Boolean(v))} />
                    Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={data.show_on_list} onCheckedChange={(v) => setData('show_on_list', Boolean(v))} />
                    Show on list
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={data.is_active} onCheckedChange={(v) => setData('is_active', Boolean(v))} />
                    Active
                </label>
            </div>

            <div className="flex gap-2">
                <Button type="submit" size="sm">
                    <Save className="size-4" />
                    {submitLabel}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default function LeadFields({ fieldsBySection }: { fieldsBySection: Record<string, LeadField[]> }) {
    const [addingNew, setAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    function handleCreate(values: FormValues) {
        router.post(
            '/settings/lead-fields',
            { ...values, options: values.options.length > 0 ? values.options : null },
            {
                preserveScroll: true,
                onSuccess: () => setAddingNew(false),
            },
        );
    }

    function handleUpdate(field: LeadField, values: FormValues) {
        router.patch(
            `/settings/lead-fields/${field.id}`,
            { ...values, options: values.options.length > 0 ? values.options : null },
            {
                preserveScroll: true,
                onSuccess: () => setEditingId(null),
            },
        );
    }

    function handleDelete(field: LeadField) {
        if (!confirm(`Delete "${field.label}"? This will remove all values saved for this field.`)) {
            return;
        }
        router.delete(`/settings/lead-fields/${field.id}`, { preserveScroll: true });
    }

    const sections = Object.entries(fieldsBySection);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lead Fields" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium">Lead Fields</h2>
                            <p className="text-muted-foreground text-sm">Define custom fields that appear on lead records.</p>
                        </div>
                        {!addingNew && (
                            <Button size="sm" onClick={() => setAddingNew(true)}>
                                <Plus className="size-4" />
                                Add Field
                            </Button>
                        )}
                    </div>

                    <FlashAlert />

                    {addingNew && (
                        <FieldForm
                            initial={emptyForm}
                            submitLabel="Create Field"
                            onSubmit={handleCreate}
                            onCancel={() => setAddingNew(false)}
                        />
                    )}

                    {sections.length === 0 && !addingNew && (
                        <p className="text-muted-foreground text-sm">No custom fields yet. Add one above.</p>
                    )}

                    {sections.map(([section, fields]) => (
                        <div key={section} className="space-y-2">
                            <h3 className="text-sm font-semibold capitalize">{section}</h3>
                            <div className="divide-y rounded-lg border">
                                {fields.map((field) => (
                                    <div key={field.id}>
                                        {editingId === field.id ? (
                                            <div className="p-2">
                                                <FieldForm
                                                    initial={{
                                                        section: field.section,
                                                        label: field.label,
                                                        key: field.key,
                                                        type: field.type,
                                                        options: field.options ?? [],
                                                        placeholder: field.placeholder ?? '',
                                                        required: field.required,
                                                        show_on_list: field.show_on_list,
                                                        sort_order: field.sort_order,
                                                        is_active: field.is_active,
                                                    }}
                                                    submitLabel="Save Changes"
                                                    onSubmit={(values) => handleUpdate(field, values)}
                                                    onCancel={() => setEditingId(null)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{field.label}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {field.type}
                                                        </Badge>
                                                        {!field.is_active && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                inactive
                                                            </Badge>
                                                        )}
                                                        {field.required && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                required
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">{field.key}</div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingId(field.id)}>
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(field)}>
                                                        <Trash2 className="size-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
