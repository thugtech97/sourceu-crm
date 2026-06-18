import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Download, FileUp } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Lead Pool', href: '/leads/pool' },
    { title: 'Import', href: '/leads/import' },
];

type RecentBatch = {
    id: number;
    filename: string;
    original_filename: string;
    total_rows: number;
    successful_rows: number;
    failed_rows: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    completed_at: string | null;
    created_by: number;
};

type Props = {
    recentBatches: RecentBatch[];
};

export default function ImportLeads({ recentBatches }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        file: null as File | null,
    });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function submit(event: FormEvent) {
        event.preventDefault();
        if (data.file) {
            post('/leads/import/upload');
        }
    }

    function handleDrag(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            setData('file', files[0]);
        }
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            setData('file', event.target.files[0]);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Leads" />

            <div className="max-w-4xl p-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold">Import Leads</h1>
                    <p className="text-muted-foreground text-sm">Upload a CSV or Excel file to import multiple leads to the pool at once.</p>
                </div>

                {/* Upload Section */}
                <div className="bg-card mb-8 space-y-6 rounded-lg border p-6 shadow-xs">
                    <div>
                        <h2 className="font-semibold">Upload File</h2>
                        <p className="text-muted-foreground text-sm">Supported formats: CSV, XLSX • Max size: 10 MB</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
                                dragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25'
                            }`}
                        >
                            <FileUp className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />

                            <div className="mb-4">
                                <p className="font-medium">Drag and drop your file here</p>
                                <p className="text-muted-foreground text-sm">or</p>
                            </div>

                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Select File
                            </Button>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {data.file && (
                                <p className="text-primary mt-4 text-sm font-medium">Selected: {data.file.name}</p>
                            )}

                            {errors.file && <p className="text-destructive mt-2 text-sm">{errors.file}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={!data.file || processing}>
                                Upload and Continue
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/leads/pool">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Download Templates Section */}
                <div className="bg-card mb-8 space-y-4 rounded-lg border p-6 shadow-xs">
                    <div>
                        <h2 className="font-semibold">Download Template</h2>
                        <p className="text-muted-foreground text-sm">Start with our pre-formatted template to ensure correct structure.</p>
                    </div>

                    <div className="flex gap-3">
                        <Button asChild variant="outline" size="sm">
                            <a href="/leads/import-template/csv" download>
                                <Download className="mr-2 h-4 w-4" />
                                CSV Template
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <a href="/leads/import-template/xlsx" download>
                                <Download className="mr-2 h-4 w-4" />
                                Excel Template
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Recent Batches */}
                {recentBatches.length > 0 && (
                    <div className="bg-card rounded-lg border shadow-xs">
                        <div className="border-b p-6">
                            <h2 className="font-semibold">Recent Imports</h2>
                        </div>

                        <div className="divide-y">
                            {recentBatches.map((batch) => (
                                <div key={batch.id} className="flex items-center justify-between p-4">
                                    <div className="flex-1">
                                        <p className="font-medium">{batch.original_filename}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {batch.total_rows} rows • {batch.successful_rows} imported • {batch.failed_rows} failed
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{
                                                backgroundColor: batch.status === 'completed' ? '#dcfce7' : batch.status === 'processing' ? '#dbeafe' : batch.status === 'failed' ? '#fee2e2' : '#f3f4f6',
                                                color: batch.status === 'completed' ? '#166534' : batch.status === 'processing' ? '#1e40af' : batch.status === 'failed' ? '#991b1b' : '#374151',
                                            }}>
                                                {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                                            </div>
                                        </div>

                                        {batch.status !== 'pending' && (
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/leads/import/${batch.id}`}>View</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
