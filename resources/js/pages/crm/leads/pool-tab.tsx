import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, Pencil } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { DISPOSITION_BADGE, initials } from './constants';
import type { PoolContact, PaginationLink } from './types';

export function PoolRow({ contact, isSelected, onSelect, onEdit }: { contact: PoolContact; isSelected: boolean; onSelect: (id: number, selected: boolean) => void; onEdit: (contact: PoolContact) => void }) {
    const [claiming, setClaiming] = useState(false);

    function claim() {
        setClaiming(true);
        router.post(`/leads/pool/${contact.id}/claim`, {}, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => setClaiming(false),
        });
    }

    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(contact.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                />
            </td>
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
                {contact.email
                    ? <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline dark:text-blue-400 text-sm">{contact.email}</a>
                    : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="hidden px-4 py-3 md:table-cell">
                {contact.phone
                    ? <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline dark:text-blue-400 text-sm">{contact.phone}</a>
                    : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DISPOSITION_BADGE[contact.disposition] ?? 'bg-muted text-muted-foreground'}`}>
                    {contact.disposition === 'recycled' ? 'Recycled' : 'New'}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <TooltipProvider delayDuration={0}>
                    <div className="flex gap-1 justify-end">
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
                                <Button size="sm" variant="ghost" disabled={claiming} onClick={claim}>
                                    <Check className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{claiming ? 'Claiming…' : 'Claim'}</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </td>
        </tr>
    );
}

type PoolTabProps = {
    data: PoolContact[];
    links: PaginationLink[];
    selectedLeads: Set<number>;
    onSelectLead: (id: number, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
    onBulkClaim: () => void;
    bulkClaiming: boolean;
    selectAllRef: React.RefObject<HTMLInputElement>;
    onEdit: (contact: PoolContact) => void;
};

export function PoolTab({ data, links, selectedLeads, onSelectLead, onSelectAll, onBulkClaim, bulkClaiming, selectAllRef, onEdit }: PoolTabProps) {
    useEffect(() => {
        if (selectAllRef.current) {
            const indeterminate = selectedLeads.size > 0 && selectedLeads.size < data.length;
            selectAllRef.current.indeterminate = indeterminate;
        }
    }, [selectedLeads, data.length, selectAllRef]);

    return (
        <>
            {selectedLeads.size > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                    <p className="text-sm font-medium">{selectedLeads.size} lead(s) selected</p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => onSelectLead(0, false)} variant="outline">
                            Clear
                        </Button>
                        <Button size="sm" onClick={onBulkClaim} disabled={bulkClaiming}>
                            {bulkClaiming ? 'Claiming…' : '✓ Claim All Selected'}
                        </Button>
                    </div>
                </div>
            )}
            <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b text-left">
                            <th className="px-4 py-3 w-12">
                                <input
                                    ref={selectAllRef}
                                    type="checkbox"
                                    checked={selectedLeads.size > 0 && selectedLeads.size === data.length}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Email</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Phone</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                                    No unclaimed leads right now — check back later.
                                </td>
                            </tr>
                        )}
                        {data.map((contact) => (
                            <PoolRow 
                                key={contact.id} 
                                contact={contact}
                                isSelected={selectedLeads.has(contact.id)}
                                onSelect={onSelectLead}
                                onEdit={onEdit}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationBar links={links} />
        </>
    );
}

export function PaginationBar({ links }: { links: PaginationLink[] }) {
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
