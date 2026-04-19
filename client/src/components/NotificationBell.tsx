import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

const TYPE_DOT: Record<string, string> = {
  info: 'bg-blue-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  alert: 'bg-red-400',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  textColor?: string;
}

export default function NotificationBell({ textColor = 'text-foreground' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: countData } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: notifications = [] } = trpc.notifications.getMyNotifications.useQuery(undefined, {
    enabled: open,
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getMyNotifications.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getMyNotifications.invalidate();
    },
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = countData?.count ?? 0;

  const handleClick = (n: any) => {
    if (!n.isRead) markRead.mutate({ id: n.id });
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-2 rounded-full hover:bg-black/5 transition-colors ${textColor}`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#d4af37] text-[#020917] text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-border z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unread > 0 && <p className="text-[11px] text-muted-foreground">{unread} unread</p>}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              (notifications as any[]).map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40 ${!n.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${n.isRead ? 'bg-slate-200' : TYPE_DOT[n.type] || 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium leading-snug ${n.isRead ? 'text-foreground/70' : 'text-foreground'}`}>{n.title}</p>
                      <p className="text-[12px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/20">
              <p className="text-[11px] text-muted-foreground text-center">Showing last {notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
