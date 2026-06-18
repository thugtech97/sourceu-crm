import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { ARCHIVE_REASONS, COLD_DISPOSITIONS, INBOUND_DISPOSITIONS, formatDateTime } from './constants';
import type { CallTranscript, DispositionOption, PoolContact } from './types';

export function TranscriptModal({ contactId, contactName, open, onClose }: { contactId: number; contactName: string; open: boolean; onClose: () => void }) {
    const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
    const [selectedTranscript, setSelectedTranscript] = useState<CallTranscript | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchTranscripts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/contacts/${contactId}/dialpad/transcripts`);
            const data = await response.json();
            if (data.success) {
                setTranscripts(data.data);
                if (data.data.length > 0) {
                    setSelectedTranscript(data.data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch transcripts:', error);
        }
        setLoading(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && transcripts.length === 0) {
            fetchTranscripts();
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Call Transcripts — {contactName}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin">⌛</div>
                        <span className="ml-2">Loading transcripts...</span>
                    </div>
                ) : transcripts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No transcripts available yet.
                    </div>
                ) : (
                    <div className="grid gap-4 py-2">
                        {/* Transcript List */}
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                            {transcripts.map((transcript) => (
                                <button
                                    key={transcript.id}
                                    onClick={() => setSelectedTranscript(transcript)}
                                    className={`w-full text-left p-2 rounded transition-colors ${
                                        selectedTranscript?.id === transcript.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                    }`}
                                >
                                    <div className="text-sm font-medium">{transcript.started_at}</div>
                                    <div className="text-xs opacity-75">
                                        {transcript.direction} • {transcript.duration_seconds}s • {transcript.user_name}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Transcript Content */}
                        {selectedTranscript && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="font-semibold">Duration:</span> {selectedTranscript.duration_seconds}s
                                    </div>
                                    <div>
                                        <span className="font-semibold">Status:</span> {selectedTranscript.status}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Started:</span> {selectedTranscript.started_at}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Rep:</span> {selectedTranscript.user_name}
                                    </div>
                                </div>

                                <div className="border-t pt-3">
                                    <h4 className="font-semibold text-sm mb-2">Transcript</h4>
                                    <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                                        {selectedTranscript.transcript_text}
                                    </div>
                                </div>

                                {selectedTranscript.recording_url && (
                                    <div>
                                        <a
                                            href={selectedTranscript.recording_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Recording
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ArchiveDialog({ contact, open, onClose }: { contact: PoolContact; open: boolean; onClose: () => void }) {
    const { data, setData, patch, processing } = useForm({ reason: '' });

    function submit() {
        if (!data.reason.trim()) return;
        patch(`/leads/pool/${contact.id}/archive`, { 
            onSuccess: () => {
                setData('reason', '');
                onClose();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Archive lead — {contact.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                    <p className="text-sm text-muted-foreground">
                        Why are you archiving this lead?
                    </p>
                    <Select value={data.reason} onValueChange={(v) => setData('reason', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a reason…" />
                        </SelectTrigger>
                        <SelectContent>
                            {ARCHIVE_REASONS.map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        disabled={!data.reason.trim() || processing} 
                        onClick={submit}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {processing ? 'Archiving…' : 'Archive Lead'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RestoreDialog({ contact, open, onClose }: { contact: PoolContact; open: boolean; onClose: () => void }) {
    const { patch, processing } = useForm({});

    function submit() {
        patch(`/leads/pool/${contact.id}/restore`, { 
            onSuccess: onClose
        });
    }

    const archiverName = contact.archivedBy 
        ? contact.archivedBy.name
        : 'Unknown';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Restore lead — {contact.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                    <p className="text-sm text-muted-foreground">
                        Restore this archived lead back to your active pool?
                    </p>
                    {contact.archive_reason && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 space-y-2">
                            <div>
                                <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Archived reason:</p>
                                <p className="text-sm text-amber-800 dark:text-amber-300">{contact.archive_reason.replace(/_/g, ' ')}</p>
                            </div>
                            {contact.archived_at && (
                                <div className="border-t border-amber-200 dark:border-amber-700 pt-2">
                                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Archived on:</p>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">{formatDateTime(contact.archived_at)}</p>
                                </div>
                            )}
                            {contact.archivedBy && (
                                <div className="border-t border-amber-200 dark:border-amber-700 pt-2">
                                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Archived by:</p>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">{archiverName}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        disabled={processing} 
                        onClick={submit}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {processing ? 'Restoring…' : 'Restore to Pool'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DispositionDialog({ contact, team, open, onClose }: { contact: PoolContact; team: string; open: boolean; onClose: () => void }) {
    const options = team === 'cold_calling' ? COLD_DISPOSITIONS : INBOUND_DISPOSITIONS;
    const { data, setData, patch, processing } = useForm({ disposition: '', reason: '', account_name: '' });
    const selected = options.find((o) => o.value === data.disposition);

    const isValid = data.disposition &&
        (!selected?.needsAccountName || data.account_name.trim()) &&
        !processing;

    function submit() {
        patch(`/leads/pool/${contact.id}/disposition`, { onSuccess: onClose });
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set outcome — {contact.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                    <Select value={data.disposition} onValueChange={(v) => setData('disposition', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose outcome…" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    <span className={o.color}>{o.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selected?.needsAccountName && (
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Company / Account name</label>
                            <input
                                className="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                placeholder="e.g. Acme Corp"
                                value={data.account_name}
                                onChange={(e) => setData('account_name', e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                    {selected?.needsReason && (
                        <input
                            className="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                            placeholder="Reason for DNC…"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!isValid} onClick={submit}>
                        {selected?.needsAccountName ? 'Convert to opportunity' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
