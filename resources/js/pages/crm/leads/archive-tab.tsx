import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime, initials } from './constants';
import { RestoreDialog } from './dialogs';
import type { PoolContact, PaginationLink } from './types';

function ArchivedLeadRow({ contact }: { contact: PoolContact }) {
    const [restoreOpen, setRestoreOpen] = useState(false);

    const archiverName = contact.archivedBy 
        ? contact.archivedBy.name
        : 'Unknown';

    return (
        <>
            <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
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
                    <div className="flex flex-col gap-1">
                        {contact.archive_reason && (
                            <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded capitalize inline-block w-fit">
                                {contact.archive_reason.replace(/_/g, ' ')}
                            </span>
                        )}
                        <div className="text-xs text-muted-foreground space-y-0.5">
                            {contact.archived_at && (
                                <p>Archived: {formatDateTime(contact.archived_at, false)}</p>
                            )}
                            {contact.archivedBy && (
                                <p>By: {archiverName}</p>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3 text-right">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => setRestoreOpen(true)} className="text-green-600 hover:text-green-700">
                                    <RotateCcw className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Restore lead</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </td>
            </tr>
            <RestoreDialog contact={contact} open={restoreOpen} onClose={() => setRestoreOpen(false)} />
        </>
    );
}

type ArchiveTabProps = {
    data: PoolContact[];
    links: PaginationLink[];
};

export function ArchiveTab({ data, links }: ArchiveTabProps) {
    return (
        <>
            <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b text-left">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Phone</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archive Reason</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-muted-foreground px-4 py-12 text-center">
                                    No archived leads.
                                </td>
                            </tr>
                        )}
                        {data.map((contact) => <ArchivedLeadRow key={contact.id} contact={contact} />)}
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
