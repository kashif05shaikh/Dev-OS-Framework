import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Bell, CheckCheck, Circle, Info, AlertTriangle, Briefcase, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey, getGetUnreadNotificationCountQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data: notifications } = useListNotifications();
  const qc = useQueryClient();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return <Info className="h-5 w-5 text-blue-500" />;
      case 'deadline': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'job': return <Briefcase className="h-5 w-5 text-purple-500" />;
      case 'event': return <Calendar className="h-5 w-5 text-emerald-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-3xl mx-auto h-full animate-in fade-in duration-300 pb-8">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-2">System alerts and upcoming triggers.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending} className="font-bold">
            <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {notifications?.length === 0 ? (
           <div className="p-16 flex flex-col items-center justify-center text-muted-foreground">
             <Bell className="h-12 w-12 opacity-20 mb-4" />
             <p className="font-medium text-sm">All caught up. No notifications.</p>
           </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications?.map(n => (
              <li key={n.id} className={cn(
                "p-5 flex gap-4 transition-colors",
                n.read ? "bg-background opacity-70" : "bg-card hover:bg-secondary/30"
              )}>
                <div className="mt-1 flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <p className={cn("font-bold text-base leading-tight", n.read ? "text-foreground" : "text-primary")}>{n.title}</p>
                    <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{format(parseISO(n.createdAt), 'MMM d, HH:mm')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 flex-shrink-0" onClick={() => handleMarkRead(n.id)} title="Mark as read">
                    <Circle className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
