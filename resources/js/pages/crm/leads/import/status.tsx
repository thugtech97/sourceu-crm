import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Download, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Lead Pool', href: '/leads/pool' },
    { title: 'Import', href: '/leads/import' },
    { title: 'Status', href: '#' },
];

type Batch = {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_rows: number;
    processed_rows: number;
    successful_rows: number;
    failed_rows: number;
    progress_percentage: number;
    started_at: string | null;
    completed_at: string | null;
    created_by: number;
    createdBy: {
        id: number;
        name: string;
    };
};

type Props = {
    batch: Batch;
};

export default function ImportStatus({ batch: initialBatch }: Props) {
    const [batch, setBatch] = useState(initialBatch);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (batch.status === 'processing' || batch.status === 'pending') {
            const interval = setInterval(() => {
                setLoading(true);
                fetch(`/leads/import/${batch.id}/status`)
                    .then((res) => res.json())
                    .then((data) => {
                        setBatch((prev) => ({ ...prev, ...data }));
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [batch.id, batch.status]);

    const isCompleted = batch.status === 'completed';
    const isFailed = batch.status === 'failed';
    const isProcessing = batch.status === 'processing';

    const getStatusColor = () => {
        if (isCompleted) return 'text-green-600';
        if (isFailed) return 'text-red-600';
        if (isProcessing) return 'text-blue-600';
        return 'text-gray-600';
    };

    const getStatusBgColor = () => {
        if (isCompleted) return 'bg-green-50 border-green-200';
        if (isFailed) return 'bg-red-50 border-red-200';
        if (isProcessing) return 'bg-blue-50 border-blue-200';
        return 'bg-gray-50 border-gray-200';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Status" />

            <div className="max-w-3xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Import Status</h1>
                </div>

                {/* Status Card */}
                <div className={`mb-6 rounded-lg border p-6 shadow-xs ${getStatusBgColor()}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {isCompleted && <CheckCircle className={`h-8 w-8 ${getStatusColor()}`} />}
                            {isFailed && <XCircle className={`h-8 w-8 ${getStatusColor()}`} />}
                            {isProcessing && <RefreshCw className={`h-8 w-8 animate-spin ${getStatusColor()}`} />}

                            <div>
                                <h2 className="text-lg font-semibold capitalize">{batch.status}</h2>
                                {batch.completed_at && (
                                    <p className="text-muted-foreground text-sm">
                                        Completed at {new Date(batch.completed_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {(isProcessing || isCompleted || isFailed) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setLoading(true);
                                    fetch(`/leads/import/${batch.id}/status`)
                                        .then((res) => res.json())
                                        .then((data) => {
                                            setBatch((prev) => ({ ...prev, ...data }));
                                            setLoading(false);
                                        });
                                }}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">{batch.progress_percentage}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${batch.progress_percentage}%` }}
                        />
                    </div>
                </div>

                {/* Statistics */}
                <div className="bg-card mb-6 grid gap-4 rounded-lg border p-6 shadow-xs md:grid-cols-4">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Rows</p>
                        <p className="mt-2 text-2xl font-bold">{batch.total_rows}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">Processed</p>
                        <p className="mt-2 text-2xl font-bold">{batch.processed_rows}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-green-600">Successful</p>
                        <p className="mt-2 text-2xl font-bold text-green-600">{batch.successful_rows}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-600">Failed</p>
                        <p className="mt-2 text-2xl font-bold text-red-600">{batch.failed_rows}</p>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-card mb-6 space-y-4 rounded-lg border p-6 shadow-xs">
                    <h2 className="font-semibold">Details</h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-muted-foreground text-sm">Success Rate</p>
                            <p className="mt-1 text-lg font-semibold">
                                {batch.total_rows > 0
                                    ? Math.round((batch.successful_rows / batch.total_rows) * 100)
                                    : 0}
                                %
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Skipped / Failed</p>
                            <p className="mt-1 text-lg font-semibold">{batch.failed_rows} rows</p>
                        </div>
                    </div>
                </div>

                {/* Error Log Download */}
                {batch.failed_rows > 0 && isCompleted && (
                    <div className="bg-yellow-50 mb-6 rounded-lg border border-yellow-200 p-6">
                        <h3 className="mb-4 font-semibold text-yellow-900">Failed Records</h3>
                        <p className="mb-3 text-sm text-yellow-800">
                            {batch.failed_rows} record(s) failed to import. Download the error log, fix the issues, and re-upload the file.
                        </p>
                        <ul className="mb-4 list-inside list-disc space-y-1 text-xs text-yellow-700">
                            <li>The first column shows the reason each record failed</li>
                            <li>Fix the data issues in the remaining columns</li>
                            <li>Re-upload the file to import the corrected records</li>
                        </ul>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/leads/import/${batch.id}/download-errors`;
                                link.download = `lead-import-errors-${batch.id}.csv`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download Error Log (CSV)
                        </Button>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    {isCompleted && (
                        <>
                            <Button asChild>
                                <Link href="/leads/pool">View Lead Pool</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/leads/import">New Import</Link>
                            </Button>
                        </>
                    )}
                    {isFailed && (
                        <Button asChild variant="outline">
                            <Link href="/leads/import">Try Again</Link>
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
