import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contacts', href: '/contacts' },
    { title: 'Import', href: '/contacts/import' },
    { title: 'Column Mapping', href: '/contacts/import/mapping' },
];

type FieldOption = {
    value: string;
    label: string;
};

type Props = {
    batchId: number;
    filename: string;
    headers: string[];
    sampleRows: string[][];
    defaultMappings: (string | null)[];
    availableFields: FieldOption[];
};

export default function MappingContacts({
    batchId,
    filename,
    headers,
    sampleRows,
    defaultMappings,
    availableFields,
}: Props) {
    const STORAGE_KEY = 'contact_import_mappings';

    const { data, setData, post, processing } = useForm({
        batch_id: batchId,
        mappings: defaultMappings,
    });

    // Load saved mappings from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const mappings = JSON.parse(saved);
                setData('mappings', mappings);
            } catch (e) {
                console.error('Failed to parse saved mappings', e);
            }
        }
    }, []);

    function submit(event: FormEvent) {
        event.preventDefault();
        // Save mappings to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.mappings));
        post('/contacts/import/confirm');
    }

    function setMapping(index: number, value: string | null) {
        const newMappings = [...data.mappings];
        newMappings[index] = value;
        setData('mappings', newMappings);
    }

    const requiredFields = ['first_name', 'last_name'];
    const mappedFields = data.mappings.filter((m) => m && m !== 'ignore');
    const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Map Columns" />

            <div className="max-w-6xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Map Columns</h1>
                    <p className="text-muted-foreground text-sm">
                        Match the columns in your file to contact fields. Required fields are marked with *.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Column Mapping */}
                    <div className="bg-card space-y-4 rounded-lg border p-6 shadow-xs">
                        <h2 className="font-semibold">Column Mapping</h2>

                        <div className="space-y-4">
                            {headers.map((header, index) => (
                                <div key={index} className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label className="text-sm font-medium">{header}</Label>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Sample: {sampleRows[0]?.[index] || '—'}
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <select
                                            value={data.mappings[index] || ''}
                                            onChange={(e) => setMapping(index, e.target.value || null)}
                                            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        >
                                            <option value="">-- Select field --</option>
                                            {availableFields.map((field) => (
                                                <option key={field.value} value={field.value}>
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-card space-y-4 rounded-lg border p-6 shadow-xs">
                        <h2 className="font-semibold">Preview</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        {data.mappings.map((mapping, index) => (
                                            <th key={index} className="px-3 py-2 text-left font-medium">
                                                {mapping && mapping !== 'ignore'
                                                    ? availableFields.find((f) => f.value === mapping)?.label ||
                                      mapping
                                                    : '—'}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sampleRows.slice(0, 3).map((row, rowIndex) => (
                                        <tr key={rowIndex} className="border-b">
                                            {row.map((cell, cellIndex) => (
                                                <td
                                                    key={cellIndex}
                                                    className={`px-3 py-2 ${
                                                        data.mappings[cellIndex] === 'ignore'
                                                            ? 'text-muted-foreground'
                                                            : ''
                                                    }`}
                                                >
                                                    {data.mappings[cellIndex] !== 'ignore'
                                                        ? cell || '—'
                                                        : '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Validation */}
                    {missingRequired.length > 0 && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <p className="text-sm font-medium text-yellow-800">
                                Missing required fields: {missingRequired.join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={missingRequired.length > 0 || processing}>
                            Proceed to Import
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/contacts/import">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
