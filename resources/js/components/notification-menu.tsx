import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';

export function NotificationMenu() {
    const { notifications } = usePage<SharedData>().props;
    const hasUnread = notifications.unread_count > 0;

    function markAsRead(id: string) {
        router.patch(`/notifications/${id}/read`, {}, { preserveScroll: true });
    }

    function markAllAsRead() {
        router.patch('/notifications/read-all', {}, { preserveScroll: true });
    }

    return (
        <DropdownMenu>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                <Bell className="size-4" />
                                {hasUnread && (
                                    <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none">
                                        {notifications.unread_count > 9 ? '9+' : notifications.unread_count}
                                    </span>
                                )}
                                <span className="sr-only">Notifications</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Notifications</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                    {hasUnread && (
                        <button type="button" className="text-muted-foreground hover:text-foreground text-xs" onClick={markAllAsRead}>
                            Mark all read
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {notifications.items.length === 0 && <div className="text-muted-foreground px-2 py-6 text-center text-sm">No notifications yet.</div>}
                {notifications.items.map((notification) => (
                    <DropdownMenuItem key={notification.id} asChild className="items-start">
                        {notification.url ? (
                            <Link href={notification.url} onClick={() => markAsRead(notification.id)} className="block w-full whitespace-normal">
                                <NotificationText notification={notification} />
                            </Link>
                        ) : (
                            <button type="button" onClick={() => markAsRead(notification.id)} className="block w-full text-left whitespace-normal">
                                <NotificationText notification={notification} />
                            </button>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationText({ notification }: { notification: SharedData['notifications']['items'][number] }) {
    return (
        <span className="flex gap-2">
            {!notification.read_at && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
            <span className="min-w-0">
                <span className="block text-sm">{notification.message}</span>
                {notification.created_at && <span className="text-muted-foreground mt-1 block text-xs">{notification.created_at}</span>}
            </span>
        </span>
    );
}
