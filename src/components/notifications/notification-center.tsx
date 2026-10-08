"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { InAppNotification, NotificationType } from "@/types/task";
import { toast } from "sonner";

interface NotificationCenterProps {
  initialNotifications: InAppNotification[];
  onNotificationClick?: (link?: string | null) => void;
}

export function NotificationCenter({
  initialNotifications,
  onNotificationClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not update notifications");
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "TASK_ASSIGNED":
      case "TASK_REASSIGNED":
        return <UserCheck className="h-3.5 w-3.5 text-blue-400" />;
      case "TASK_COMPLETED":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case "COMMENT_ADDED":
        return <MessageSquare className="h-3.5 w-3.5 text-purple-400" />;
      case "TASK_DUE_SOON":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
        aria-label="Open notifications"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.2 text-[10px] font-semibold text-blue-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const formattedTime = new Date(n.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) handleMarkAsRead(n.id);
                      if (n.link && onNotificationClick) {
                        onNotificationClick(n.link);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left ${
                      n.isRead
                        ? "bg-zinc-900/60 hover:bg-zinc-850"
                        : "bg-blue-600/5 hover:bg-blue-600/10 border-l-2 border-blue-500"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 rounded-lg bg-zinc-800 p-1.5 border border-zinc-700/60">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {formattedTime}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                    </div>

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        className="text-zinc-500 hover:text-white p-0.5"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                You have no notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
