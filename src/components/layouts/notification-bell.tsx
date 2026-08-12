'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/formatters';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: 'ghost', size: 'icon' }) + ' relative'}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-xs font-bold text-white shadow-md shadow-red-500/40 ring-2 ring-background animate-pulse-glow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="text-xs text-blue-600 hover:underline"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-4 py-3 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead.mutate(notification.id);
                  }
                }}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{notification.title}</span>
                    {!notification.isRead && (
                      <Badge variant="destructive" className="h-4 text-[10px] px-1">
                        Baru
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{notification.message}</p>
                  <span className="text-[10px] text-gray-400">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
