import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { ArchiveTab } from './archive-tab';
import { MyLeadsTab } from './my-leads-tab';
import { PoolTab } from './pool-tab';
import AddLeadDialog from './add-lead-dialog';
import type { LeadPoolProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Lead Pool', href: '/leads/pool' }];

export default function LeadPool({ pool, myLeads, archived, team, teams, accounts }: LeadPoolProps) {
    const [activeTab, setActiveTab] = useState<'pool' | 'mine' | 'archive'>('pool');
    const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
    const [bulkClaiming, setBulkClaiming] = useState(false);
    const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any | null>(null);
    
    // Search and rows per page for each tab
    const [poolSearch, setPoolSearch] = useState('');
    const [poolRowsPerPage, setPoolRowsPerPage] = useState(20);
    const [myLeadsSearch, setMyLeadsSearch] = useState('');
    const [myLeadsRowsPerPage, setMyLeadsRowsPerPage] = useState(20);
    const [archiveSearch, setArchiveSearch] = useState('');
    const [archiveRowsPerPage, setArchiveRowsPerPage] = useState(20);
    
    const selectAllRef = useRef<HTMLInputElement>(null);
    const { post } = useForm();

    // Filter function
    function searchContacts(contacts: any[], query: string) {
        if (!query) return contacts;
        const q = query.toLowerCase();
        return contacts.filter((c) =>
            c.first_name?.toLowerCase().includes(q) ||
            c.last_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.name?.toLowerCase().includes(q)
        );
    }

    function switchTeam(newTeam: string) {
        router.get('/leads/pool', { team: newTeam }, { preserveState: false });
    }

    function handleEditContact(contact: any) {
        setEditingContact(contact);
        setAddLeadDialogOpen(true);
    }

    function handleCloseDialog() {
        setEditingContact(null);
        setAddLeadDialogOpen(false);
    }

    function handleSelectLead(id: number, selected: boolean) {
        setSelectedLeads((prev) => {
            const next = new Set(prev);
            if (selected) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }

    function handleSelectAll(selected: boolean) {
        if (selected) {
            setSelectedLeads(new Set(pool.data.map((c) => c.id)));
        } else {
            setSelectedLeads(new Set());
        }
    }

    function bulkClaim() {
        setBulkClaiming(true);
        router.post('/leads/pool/bulk-claim', 
            { contact_ids: Array.from(selectedLeads) },
            {
                preserveScroll: true,
                preserveState: false,
                onFinish: () => {
                    setBulkClaiming(false);
                    setSelectedLeads(new Set());
                },
            }
        );
    }

    const currentTeam = teams.find((t) => t.value === team);
    const expiringCount = myLeads.data.filter((c) => {
        if (!c.pool_expires_at) return false;
        return new Date(c.pool_expires_at).getTime() - Date.now() < 6 * 3_600_000;
    }).length;
    const recycledCount = pool.data.filter((c) => c.disposition === 'recycled').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lead Pool" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Lead Pool</h1>
                        <p className="text-muted-foreground text-sm">
                            {currentTeam?.label} — first to dial claims the lead.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/leads/import">⬆ Import</Link>
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => setAddLeadDialogOpen(true)}
                        >
                            + Add Lead
                        </Button>
                        <Select value={team} onValueChange={switchTeam}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <FlashAlert />

                {/* Summary strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Unclaimed</p>
                        <p className="text-2xl font-bold">{pool.data.length}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">My active leads</p>
                        <p className="text-2xl font-bold">{myLeads.data.length}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Expiring soon (&lt;6h)</p>
                        <p className="text-2xl font-bold text-red-600">{expiringCount}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Recycled leads</p>
                        <p className="text-2xl font-bold">{recycledCount}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Archived</p>
                        <p className="text-2xl font-bold text-amber-600">{archived.data.length}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg border p-1 w-fit bg-muted/40">
                    {(['pool', 'mine', 'archive'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab === 'pool' ? 'Pool' : tab === 'mine' ? 'My Leads' : 'Archive'}
                            {tab === 'pool' && pool.data.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{pool.data.length}</span>
                            )}
                            {tab === 'mine' && myLeads.data.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{myLeads.data.length}</span>
                            )}
                            {tab === 'archive' && archived.data.length > 0 && (
                                <span className="ml-2 rounded-full bg-amber/15 px-1.5 py-0.5 text-xs text-amber-600">{archived.data.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Pool tab */}
                {activeTab === 'pool' && (
                    <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={poolSearch}
                                onChange={(e) => setPoolSearch(e.target.value)}
                                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Rows per page:</label>
                                <Select value={String(poolRowsPerPage)} onValueChange={(v) => setPoolRowsPerPage(Number(v))}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <PoolTab 
                            data={searchContacts(pool.data, poolSearch).slice(0, poolRowsPerPage)}
                            links={pool.links}
                            selectedLeads={selectedLeads}
                            onSelectLead={handleSelectLead}
                            onSelectAll={handleSelectAll}
                            onBulkClaim={bulkClaim}
                            bulkClaiming={bulkClaiming}
                            selectAllRef={selectAllRef}
                            onEdit={handleEditContact}
                        />
                    </>
                )}

                {/* My Leads tab */}
                {activeTab === 'mine' && (
                    <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={myLeadsSearch}
                                onChange={(e) => setMyLeadsSearch(e.target.value)}
                                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Rows per page:</label>
                                <Select value={String(myLeadsRowsPerPage)} onValueChange={(v) => setMyLeadsRowsPerPage(Number(v))}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <MyLeadsTab 
                            data={searchContacts(myLeads.data, myLeadsSearch).slice(0, myLeadsRowsPerPage)}
                            links={myLeads.links}
                            team={team}
                            onEdit={handleEditContact}
                        />
                    </>
                )}

                {/* Archive tab */}
                {activeTab === 'archive' && (
                    <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={archiveSearch}
                                onChange={(e) => setArchiveSearch(e.target.value)}
                                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Rows per page:</label>
                                <Select value={String(archiveRowsPerPage)} onValueChange={(v) => setArchiveRowsPerPage(Number(v))}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <ArchiveTab 
                            data={searchContacts(archived.data, archiveSearch).slice(0, archiveRowsPerPage)}
                            links={archived.links}
                        />
                    </>
                )}
            </div>

            {/* Add Lead Dialog */}
            <AddLeadDialog
                open={addLeadDialogOpen}
                onClose={handleCloseDialog}
                team={team}
                contact={editingContact}
                accounts={accounts}
            />
        </AppLayout>
    );
}
