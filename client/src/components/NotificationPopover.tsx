import { useState, useEffect } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle2, Info, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: 'payment' | 'attendance' | 'general';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationPopoverProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => Promise<void>;
    variant?: 'student' | 'staff';
}

export function NotificationPopover({ notifications, onMarkAsRead, variant = 'staff' }: NotificationPopoverProps) {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const [open, setOpen] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'payment':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'attendance':
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <Info className="h-4 w-4 text-orange-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 border border-muted/50 bg-white shadow-sm hover:bg-muted/10 transition-all rounded-xl">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white border-2 border-white shadow-sm animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0 border-muted/50 shadow-2xl rounded-2xl overflow-hidden" align="end">
                <div className="p-4 border-b border-muted/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 text-muted-foreground/40">
                                <Bell className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">All caught up!</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">No new notifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-muted/30">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 transition-colors cursor-default hover:bg-muted/10 relative group",
                                        !notification.isRead && "bg-primary/5 hover:bg-primary/10"
                                    )}
                                    onMouseEnter={() => {
                                        if (!notification.isRead) {
                                            onMarkAsRead(notification.id);
                                        }
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-bold leading-none truncate",
                                                notification.isRead ? "text-gray-700" : "text-gray-900"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60 font-medium">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="h-2 w-2 rounded-full bg-primary shadow-sm" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-muted/50 bg-muted/5 text-center">
                        <Button variant="ghost" size="sm" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors h-auto p-1">
                            Clear All Notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
