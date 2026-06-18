import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/confirm-dialog';
import { Link, router } from '@inertiajs/react';
import { AlertTriangle, Archive, Clock, MessageSquare, Phone, RefreshCw, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { initials, timeLeft } from './constants';
import { ArchiveDialog, DispositionDialog, TranscriptModal } from './dialogs';
import type { PoolContact, PaginationLink } from './types';

function MyLeadRow({ contact, team }: { contact: PoolContact; team: string }) {
    const [dispositionOpen, setDispositionOpen] = useState(false);
    const [releaseOpen, setReleaseOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [transcriptOpen, setTranscriptOpen] = useState(false);
    const [dialing, setDialing] = useState(false);
    const timer = timeLeft(contact.pool_expires_at);

    function release() {
        router.patch(`/leads/pool/${contact.id}/release`, {}, { preserveScroll: true, onFinish: () => setReleaseOpen(false) });
    }

    function dialContact() {
        setDialing(true);
        router.post(`/contacts/${contact.id}/dialpad/dial`, {}, {
            preserveScroll: true,
            onFinish: () => setDialing(false),
        });
    }

    return (
        <>
            <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                            {initials(contact.name)}
                        </div>
                        <div className="min-w-0">
                            <Link href={`/contacts/${contact.id}/edit`} className="font-medium hover:underline">
                                {contact.name}
                            </Link>
                            {contact.account?.name && <p className="text-muted-foreground text-xs">{contact.account.name}</p>}
                        </div>
                    </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                    {contact.phone
                        ? <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline dark:text-blue-400 text-sm">{contact.phone}</a>
                        : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                    {timer.label && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${timer.urgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {timer.urgent ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
                            {timer.label}
                        </span>
                    )}
                </td>
                <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => setDispositionOpen(true)}>
                            <UserCheck className="mr-1.5 size-3.5" />
                            Set outcome
                        </Button>
                        {contact.phone && (
                            <Button size="sm" variant="outline" disabled={dialing} onClick={dialContact} title="Call with Dialpad">
                                <Phone className="size-3.5" />
                            </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setTranscriptOpen(true)} title="View call transcripts">
                            <MessageSquare className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setArchiveOpen(true)} title="Archive lead">
                            <Archive className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReleaseOpen(true)} title="Release to pool">
                            <RefreshCw className="size-3.5" />
                        </Button>
                    </div>
                </td>
            </tr>
            <DispositionDialog contact={contact} team={team} open={dispositionOpen} onClose={() => setDispositionOpen(false)} />
            <ArchiveDialog contact={contact} open={archiveOpen} onClose={() => setArchiveOpen(false)} />
            <TranscriptModal contactId={contact.id} contactName={contact.name} open={transcriptOpen} onClose={() => setTranscriptOpen(false)} />
            <ConfirmDialog
                open={releaseOpen}
                onClose={() => setReleaseOpen(false)}
                onConfirm={release}
                title="Release lead to pool?"
                description={`${contact.name} will return to the shared pool and can be claimed by any rep.`}
                confirmLabel="Release"
                variant="default"
            />
        </>
    );
}

type MyLeadsTabProps = {
    data: PoolContact[];
    links: PaginationLink[];
    team: string;
};

export function MyLeadsTab({ data, links, team }: MyLeadsTabProps) {
    return (
        <>
            <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b text-left">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Phone</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expires</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-muted-foreground px-4 py-12 text-center">
                                    You have no active leads. Claim some from the Pool tab.
                                </td>
                            </tr>
                        )}
                        {data.map((contact) => <MyLeadRow key={contact.id} contact={contact} team={team} />)}
                    </tbody>
                </table>
            </div>
            <PaginationBar links={links} />
        </>
    );
}

function PaginationBar({ links }: { links: PaginationLink[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
                <Button key={link.label} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? 'default' : 'outline'} size="sm">
                    {link.url
                        ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                        : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                </Button>
            ))}
        </div>
    );
}
