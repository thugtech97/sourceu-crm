import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Copy, Download } from 'lucide-react';

interface CallLog {
    id: number;
    dialpad_call_id: string;
    contact_name?: string;
    status: string;
    direction: string;
    started_at: string;
    duration_seconds?: number;
}

interface WebhookLog {
    id: number;
    event_type: string;
    processed: boolean;
    error?: string;
    created_at: string;
}

interface ConnectedUser {
    id: number;
    name: string;
    email: string;
    dialpad_user_id: string;
    dialpad_number?: string;
}

interface Stats {
    api_key_configured: boolean;
    sandbox_mode: boolean;
    base_url: string;
    users_connected: number;
    total_calls: number;
    recent_calls: CallLog[];
    webhook_logs: WebhookLog[];
    connected_users: ConnectedUser[];
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function DialpadDashboard() {
    const page = usePage<{ stats: Stats }>();
    const stats = page.props.stats;
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [emailToTest, setEmailToTest] = useState('');
    const [copyNotification, setCopyNotification] = useState(false);

    const handleTestConnection = async () => {
        setTestStatus('loading');
        try {
            const response = await fetch('/dialpad/test/connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                setTestStatus('error');
                setTestMessage(`✗ HTTP ${response.status}`);
                setTimeout(() => setTestStatus('idle'), 4000);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setTestStatus('success');
                setTestMessage(`✓ Connected successfully (${data.status})`);
            } else {
                setTestStatus('error');
                setTestMessage(`✗ ${data.message}`);
            }
        } catch (error) {
            setTestStatus('error');
            setTestMessage(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        setTimeout(() => setTestStatus('idle'), 4000);
    };

    const handleTestUserLookup = async () => {
        if (!emailToTest) {
            setTestMessage('Please enter an email address');
            return;
        }

        setTestStatus('loading');
        try {
            const response = await fetch('/dialpad/test/user-lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailToTest }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                setTestStatus('error');
                setTestMessage(`✗ HTTP ${response.status}`);
                setTimeout(() => setTestStatus('idle'), 4000);
                return;
            }

            const data = await response.json();

            if (data.success && data.data.matched) {
                setTestStatus('success');
                setTestMessage(`✓ Found Dialpad user: ${data.data.matched_user?.name || 'N/A'}`);
            } else {
                setTestStatus('error');
                setTestMessage(`✗ User not found or lookup failed`);
            }
        } catch (error) {
            setTestStatus('error');
            setTestMessage(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        setTimeout(() => setTestStatus('idle'), 4000);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopyNotification(true);
        setTimeout(() => setCopyNotification(false), 2000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'connected':
                return 'bg-blue-100 text-blue-800';
            case 'initiated':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <Head title="Dialpad Integration Test" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900">Dialpad Integration Dashboard</h1>
                    <p className="text-slate-600">Test and monitor your Dialpad integration</p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">API Key</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                            {stats.api_key_configured ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-semibold">
                                {stats.api_key_configured ? 'Configured' : 'Missing'}
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Mode</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={stats.sandbox_mode ? 'secondary' : 'default'}>
                                {stats.sandbox_mode ? 'Sandbox' : 'Production'}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Connected Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.users_connected}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Calls</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_calls}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Base URL */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">API Base URL</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between bg-slate-50 p-3 rounded border font-mono text-sm">
                        <span>{stats.base_url}</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(stats.base_url)}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Test Connection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Connection Test</CardTitle>
                        <CardDescription>Verify your API connection to Dialpad</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={handleTestConnection} disabled={testStatus === 'loading'}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${testStatus === 'loading' ? 'animate-spin' : ''}`} />
                            {testStatus === 'loading' ? 'Testing...' : 'Test Connection'}
                        </Button>
                        {testMessage && (
                            <div className={`p-3 rounded-lg text-sm ${
                                testStatus === 'success' ? 'bg-green-50 text-green-800' :
                                testStatus === 'error' ? 'bg-red-50 text-red-800' :
                                'bg-blue-50 text-blue-800'
                            }`}>
                                {testMessage}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User Lookup Test */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Lookup Test</CardTitle>
                        <CardDescription>Find a Dialpad user by email</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="user@example.com"
                                value={emailToTest}
                                onChange={(e) => setEmailToTest(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button onClick={handleTestUserLookup} disabled={testStatus === 'loading'}>
                                {testStatus === 'loading' ? 'Searching...' : 'Search'}
                            </Button>
                        </div>
                        {testMessage && (
                            <div className={`p-3 rounded-lg text-sm ${
                                testStatus === 'success' ? 'bg-green-50 text-green-800' :
                                testStatus === 'error' ? 'bg-red-50 text-red-800' :
                                'bg-blue-50 text-blue-800'
                            }`}>
                                {testMessage}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Connected Users */}
                {stats.connected_users.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Users ({stats.connected_users.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b">
                                        <tr>
                                            <th className="text-left py-2 px-3">Name</th>
                                            <th className="text-left py-2 px-3">Email</th>
                                            <th className="text-left py-2 px-3">Dialpad ID</th>
                                            <th className="text-left py-2 px-3">Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.connected_users.map((user) => (
                                            <tr key={user.id} className="border-b hover:bg-slate-50">
                                                <td className="py-2 px-3">{user.name}</td>
                                                <td className="py-2 px-3">{user.email}</td>
                                                <td className="py-2 px-3 font-mono text-xs">{user.dialpad_user_id}</td>
                                                <td className="py-2 px-3">{user.dialpad_number || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Calls */}
                {stats.recent_calls.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Calls</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats.recent_calls.map((call) => (
                                    <div key={call.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                                        <div className="flex-1">
                                            <div className="font-medium">{call.contact_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-600">{call.started_at}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={getStatusColor(call.status)}>
                                                {call.status}
                                            </Badge>
                                            {call.duration_seconds && (
                                                <span className="text-sm text-slate-600">{call.duration_seconds}s</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Webhooks */}
                {stats.webhook_logs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Webhook Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {stats.webhook_logs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                                        <div className="flex items-center gap-2">
                                            {log.processed ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                            )}
                                            <span>{log.event_type}</span>
                                        </div>
                                        <span className="text-xs text-slate-600">{log.created_at}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Links */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-3 flex-wrap">
                        <Button variant="outline" onClick={() => window.location.href = '/crm'}>
                            Back to CRM
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(stats, null, 2))}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Status JSON
                        </Button>
                    </CardContent>
                </Card>

                {copyNotification && (
                    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                        Copied to clipboard
                    </div>
                )}
            </div>
        </div>
    );
}
