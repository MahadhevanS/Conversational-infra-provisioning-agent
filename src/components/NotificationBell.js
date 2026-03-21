import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../utils/notificationApi";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [latestMessage, setLatestMessage] = useState("");

  const wrapperRef = useRef(null);
  const firstLoadRef = useRef(true);
  const previousIdsRef = useRef(new Set());
  const originalTitleRef = useRef(document.title);
  const requestSeqRef = useRef(0);
  const isBusyRef = useRef(false);
  const isPollingRef = useRef(false);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const token = localStorage.getItem("cloudcrafter_token");
  const userId = localStorage.getItem("user_id");

  const getNotificationUniqueKey = useCallback((item) => {
    return (
      item.notification_key ||
      `${item.id || ""}|${item.title || ""}|${item.type || ""}|${
        item.metadata?.job_id || ""
      }|${item.metadata?.job_type || ""}|${item.metadata?.run_id || ""}|${
        item.metadata?.plan_job_id || ""
      }|${item.metadata?.project_id || ""}`
    );
  }, []);

  const dedupeNotifications = useCallback(
    (items) => {
      return Array.from(
        new Map(items.map((item) => [getNotificationUniqueKey(item), item])).values()
      );
    },
    [getNotificationUniqueKey]
  );

  const requestBrowserNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" +
          "tvT18AAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      );
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (error) {
      console.error("Audio play failed:", error);
    }
  };

  const showBrowserNotification = (title, message) => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title || "New Notification", {
          body: message || "You have received a new notification.",
        });
      }
    } catch (error) {
      console.error("Browser notification failed:", error);
    }
  };

  const detectNewNotifications = useCallback((items) => {
    const currentIds = new Set(items.map((n) => n.id));

    if (firstLoadRef.current) {
      previousIdsRef.current = currentIds;
      firstLoadRef.current = false;
      return;
    }

    const newItems = items.filter(
      (n) => !previousIdsRef.current.has(n.id) && !n.is_read
    );

    if (newItems.length > 0) {
      const newest = newItems[0];
      setLatestMessage(newest.title || "New notification received");
      playNotificationSound();
      showBrowserNotification(newest.title, newest.message);
    }

    previousIdsRef.current = currentIds;
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      if (!userId || !token) return;
      if (isPollingRef.current) return;

      isPollingRef.current = true;
      const requestId = ++requestSeqRef.current;

      const [notifRes, countRes] = await Promise.all([
        fetchNotifications(userId, token),
        fetchUnreadCount(userId, token),
      ]);

      if (!isMountedRef.current) return;
      if (requestId !== requestSeqRef.current) return;

      const rawItems = Array.isArray(notifRes.notifications)
        ? notifRes.notifications
        : [];

      const uniqueItems = dedupeNotifications(rawItems);

      setNotifications(uniqueItems);
      setUnreadCount(Number(countRes.unread_count) || 0);
      detectNewNotifications(uniqueItems);
    } catch (error) {
      console.error("Notification load error:", error);
    } finally {
      isPollingRef.current = false;
    }
  }, [userId, token, dedupeNotifications, detectNewNotifications]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !token) return;

    requestBrowserNotificationPermission();
    loadNotifications();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (!isBusyRef.current && !isPollingRef.current) {
        loadNotifications();
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadNotifications, userId, token]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!latestMessage) return;

    const timer = setTimeout(() => {
      setLatestMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [latestMessage]);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `• (${unreadCount}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }

    return () => {
      document.title = originalTitleRef.current;
    };
  }, [unreadCount]);

  const handleRead = async (id, isRead) => {
    try {
      if (isRead || isBusyRef.current || !token) return;

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markNotificationRead(id, token);
    } catch (error) {
      console.error("Mark read failed:", error);
      await loadNotifications();
    }
  };

  const handleReadAll = async () => {
    try {
      if (!userId || !token || isBusyRef.current) return;

      isBusyRef.current = true;
      await markAllNotificationsRead(userId, token);

      setLatestMessage("");
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );
      setUnreadCount(0);

      requestSeqRef.current += 1;
      await loadNotifications();
    } catch (error) {
      console.error("Mark all read failed:", error);
      await loadNotifications();
    } finally {
      isBusyRef.current = false;
    }
  };

  const handleDelete = async (event, id) => {
    try {
      event.stopPropagation();
      if (!token || isBusyRef.current) return;

      isBusyRef.current = true;

      const deletedItem = notifications.find((item) => item.id === id);

      setNotifications((prev) => prev.filter((item) => item.id !== id));
      if (deletedItem && !deletedItem.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      previousIdsRef.current = new Set(
        [...previousIdsRef.current].filter((existingId) => existingId !== id)
      );
      setLatestMessage("");
      requestSeqRef.current += 1;

      await deleteNotification(id, token);
      await loadNotifications();
    } catch (error) {
      console.error("Delete notification failed:", error);
      await loadNotifications();
    } finally {
      isBusyRef.current = false;
    }
  };

  const handleClearAll = async () => {
    try {
      if (!userId || !token || isBusyRef.current) return;

      isBusyRef.current = true;

      setLatestMessage("");
      setNotifications([]);
      setUnreadCount(0);
      previousIdsRef.current = new Set();
      firstLoadRef.current = true;
      requestSeqRef.current += 1;

      await clearAllNotifications(userId, token);
      await loadNotifications();
    } catch (error) {
      console.error("Clear all failed:", error);
      await loadNotifications();
    } finally {
      isBusyRef.current = false;
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
  };

  const getBorderColor = (type) => {
    const t = String(type || "").toUpperCase();
    if (t === "ERROR") return "#ef4444";
    if (t === "SUCCESS") return "#22c55e";
    if (t === "WARNING") return "#f59e0b";
    return "#3b82f6";
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Notifications"
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#d4d4d8",
          fontSize: "18px",
          cursor: "pointer",
          position: "relative",
          width: "38px",
          height: "38px",
          borderRadius: "10px",
        }}
      >
        🔔

        {unreadCount > 0 && (
          <>
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                background: "#ef4444",
                color: "white",
                borderRadius: "999px",
                minWidth: "18px",
                height: "18px",
                padding: "0 5px",
                fontSize: "11px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>

            <span
              style={{
                position: "absolute",
                top: "4px",
                left: "4px",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 4px #22c55e",
              }}
            />
          </>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "46px",
            width: "360px",
            maxHeight: "420px",
            overflowY: "auto",
            background: "#111111",
            color: "#f4f4f5",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            zIndex: 1000,
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "15px" }}>Notifications</h4>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleReadAll}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#e4e4e7",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Mark all read
              </button>

              <button
                onClick={handleClearAll}
                style={{
                  background: "rgba(239,68,68,0.10)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Clear all
              </button>
            </div>
          </div>

          {latestMessage && (
            <div
              style={{
                marginBottom: "10px",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(34,197,94,0.10)",
                border: "1px solid rgba(34,197,94,0.30)",
                color: "#86efac",
                fontSize: "13px",
              }}
            >
              New notification received: {latestMessage}
            </div>
          )}

          {notifications.length === 0 ? (
            <p style={{ margin: 0, color: "#a1a1aa", fontSize: "14px" }}>
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notification_key || n.id}
                onClick={() => handleRead(n.id, n.is_read)}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  position: "relative",
                  background: n.is_read
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(59,130,246,0.10)",
                  borderLeft: `4px solid ${getBorderColor(n.type)}`,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  title="Remove notification"
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "transparent",
                    border: "none",
                    color: "#a1a1aa",
                    fontSize: "14px",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ✖
                </button>

                <strong
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    paddingRight: "20px",
                  }}
                >
                  {n.title}
                </strong>

                <p
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "13px",
                    color: "#d4d4d8",
                    lineHeight: 1.4,
                    paddingRight: "20px",
                  }}
                >
                  {n.message}
                </p>

                <small style={{ color: "#a1a1aa" }}>
                  {formatDate(n.created_at)}
                </small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}