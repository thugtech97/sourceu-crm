import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Deals', href: '/deals' },
    { title: 'Kanban', href: '/deals/kanban' },
];

type Deal = {
    id: number;
    name: string;
    stage: string;
    value: string;
    probability: number;
    contact?: { first_name: string; last_name: string } | null;
    account?: { name: string } | null;
};

type Props = {
    columns: Record<string, Deal[]>;
    pipelineStages: string[];
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const STAGE_LABELS: Record<string, string> = {
    new: 'New',
    meeting_booked: 'Meeting Booked',
    qualified: 'Qualified',
    proposal: 'Proposal',
    won: 'Won',
};

const STAGE_COLORS: Record<string, string> = {
    new: 'bg-slate-100 dark:bg-slate-800',
    meeting_booked: 'bg-blue-50 dark:bg-blue-950',
    qualified: 'bg-amber-50 dark:bg-amber-950',
    proposal: 'bg-purple-50 dark:bg-purple-950',
    won: 'bg-green-50 dark:bg-green-950',
};

const STAGE_HEADER_COLORS: Record<string, string> = {
    new: 'border-slate-300 dark:border-slate-600',
    meeting_booked: 'border-blue-300 dark:border-blue-700',
    qualified: 'border-amber-300 dark:border-amber-700',
    proposal: 'border-purple-300 dark:border-purple-700',
    won: 'border-green-300 dark:border-green-700',
};

function columnTotal(deals: Deal[]): number {
    return deals.reduce((sum, d) => sum + Number(d.value), 0);
}

function weightedTotal(deals: Deal[]): number {
    return deals.reduce((sum, d) => sum + (Number(d.value) * d.probability) / 100, 0);
}

function DealCard({ deal }: { deal: Deal }) {
    const wasDragging = useRef(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

    // Set flag while dnd-kit says this card is being dragged
    if (isDragging) wasDragging.current = true;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            // Reset flag on fresh pointer-down, but still call dnd-kit's handler
            onPointerDown={(e) => {
                wasDragging.current = false;
                (listeners as Record<string, (e: React.PointerEvent) => void>)?.onPointerDown?.(e);
            }}
            className={`bg-card cursor-grab select-none rounded-md border p-3 shadow-xs active:cursor-grabbing ${isDragging ? 'opacity-40 shadow-lg' : 'hover:shadow-sm'}`}
        >
            <Link
                href={`/deals/${deal.id}/edit`}
                className="line-clamp-1 text-sm font-medium hover:underline"
                onClick={(e) => {
                    if (wasDragging.current) {
                        e.preventDefault();
                        wasDragging.current = false;
                    }
                }}
            >
                {deal.name}
            </Link>
            {(deal.contact || deal.account) && (
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : deal.account?.name}
                </p>
            )}
            <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-semibold">{money.format(Number(deal.value))}</span>
                <Badge variant="secondary" className="text-xs">{deal.probability}%</Badge>
                <span className="text-muted-foreground text-xs">{money.format(weightedTotal([deal]))} wtd</span>
            </div>
        </div>
    );
}

function Column({ stage, deals }: { stage: string; deals: Deal[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });

    return (
        <div className={`flex min-w-60 flex-1 flex-col rounded-xl border-2 ${STAGE_HEADER_COLORS[stage] ?? 'border-border'} ${STAGE_COLORS[stage] ?? ''} ${isOver ? 'ring-primary ring-2 ring-offset-1' : ''}`}>
            <div className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{STAGE_LABELS[stage] ?? stage}</span>
                    <span className="bg-background/60 rounded-full px-2 py-0.5 text-xs font-medium">{deals.length}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">{money.format(columnTotal(deals))}</p>
            </div>

            <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-2 pt-0">
                <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {deals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                    ))}
                </SortableContext>

                {deals.length === 0 && (
                    <div className={`flex flex-1 items-center justify-center rounded-md border-2 border-dashed py-8 text-xs text-muted-foreground ${isOver ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DealsKanban({ columns: initialColumns, pipelineStages }: Props) {
    const [columns, setColumns] = useState(initialColumns);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;

        const dealId = active.id as number;
        const overId = over.id;
        const targetStage = pipelineStages.includes(overId as string)
            ? (overId as string)
            : findStageForDeal(overId as number);

        if (!targetStage) return;

        const sourceStage = findStageForDeal(dealId);
        if (!sourceStage || sourceStage === targetStage) return;

        setColumns((prev) => {
            const updated = { ...prev };
            const deal = updated[sourceStage].find((d) => d.id === dealId);
            if (!deal) return prev;
            updated[sourceStage] = updated[sourceStage].filter((d) => d.id !== dealId);
            updated[targetStage] = [{ ...deal, stage: targetStage }, ...updated[targetStage]];
            return updated;
        });

        router.patch(`/deals/${dealId}/stage`, { stage: targetStage }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setColumns(initialColumns),
        });
    }

    function findStageForDeal(dealId: number): string | undefined {
        for (const [stage, deals] of Object.entries(columns)) {
            if (deals.some((d) => d.id === dealId)) return stage;
        }
    }

    const allDeals = Object.values(columns).flat();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pipeline Kanban" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Pipeline</h1>
                        <p className="text-muted-foreground text-sm">
                            {allDeals.length} deals &middot; {money.format(columnTotal(allDeals))} total &middot;{' '}
                            {money.format(weightedTotal(allDeals))} weighted
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/deals">List view</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/deals/create">+ New deal</Link>
                        </Button>
                    </div>
                </div>

                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                    <div className="flex gap-3 overflow-x-auto pb-4">
                        {pipelineStages.map((stage) => (
                            <Column key={stage} stage={stage} deals={columns[stage] ?? []} />
                        ))}
                    </div>
                </DndContext>
            </div>
        </AppLayout>
    );
}
