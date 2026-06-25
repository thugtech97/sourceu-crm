import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ConfirmDialog from '@/components/confirm-dialog';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Clock, MessageSquare, Pencil, Phone, RefreshCw, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { initials, timeLeft } from './constants';
import { DispositionDialog, TranscriptModal } from './dialogs';
import type { PoolContact, PaginationLink } from './types';
import type { SharedData } from '@/types';

function MyLeadRow({ contact, team, onEdit }: { contact: PoolContact; team: string; onEdit: (contact: PoolContact) => void }) {
    const [dispositionOpen, setDispositionOpen] = useState(false);
    const [releaseOpen, setReleaseOpen] = useState(false);
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
                    {contact.disposition === 'meeting_booked' && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                            Meeting booked
                        </span>
                    )}
                    {contact.disposition === 'warm_email' && (
                        <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-900/30 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                            Warm email
                        </span>
                    )}
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
                    <TooltipProvider delayDuration={0}>
                        <div className="flex justify-end gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={() => onEdit(contact)}>
                                        <Pencil className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={() => setDispositionOpen(true)}>
                                        <UserCheck className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Set outcome</TooltipContent>
                            </Tooltip>
                            {contact.phone && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" disabled={dialing} onClick={dialContact}>
                                            <Phone className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Call with Dialpad</TooltipContent>
                                </Tooltip>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={() => setTranscriptOpen(true)}>
                                        <MessageSquare className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View call transcripts</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={() => setReleaseOpen(true)}>
                                        <RefreshCw className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Release to pool</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                </td>
            </tr>
            <DispositionDialog contact={contact} team={team} open={dispositionOpen} onClose={() => setDispositionOpen(false)} />

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
    onEdit: (contact: PoolContact) => void;
};

export function MyLeadsTab({ data, links, team, onEdit }: MyLeadsTabProps) {
    return (
        <>
            <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b text-left">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Phone</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expires</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-muted-foreground px-4 py-12 text-center">
                                    You have no active leads. Claim some from the Pool tab.
                                </td>
                            </tr>
                        )}
                        {data.map((contact) => <MyLeadRow key={contact.id} contact={contact} team={team} onEdit={onEdit} />)}
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
