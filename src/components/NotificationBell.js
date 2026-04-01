// import { useEffect, useRef, useState, useCallback } from "react";
// import {
//   fetchNotifications, fetchUnreadCount, markNotificationRead,
//   markAllNotificationsRead, deleteNotification, clearAllNotifications,
// } from "../utils/notificationApi";
// import { useRealtimeInsert } from "../hooks/useSupabaseRealtime";

// export default function NotificationBell() {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount]     = useState(0);
//   const [open, setOpen]                   = useState(false);
//   const [latestMessage, setLatestMessage] = useState("");

//   const wrapperRef          = useRef(null);
//   const firstLoadRef        = useRef(true);
//   const previousIdsRef      = useRef(new Set());
//   const originalTitleRef    = useRef(document.title);
//   const isBusyRef           = useRef(false);
//   const isMountedRef        = useRef(true);

//   const token = localStorage.getItem("cloudcrafter_token");


//   const [userId, setUserId] = useState(null);

//   useEffect(() => {
//     try {
//       const session = JSON.parse(localStorage.getItem("cloudcrafter_session"));
//       setUserId(session?.user_id);
//     } catch {
//       setUserId(null);
//     }
//   }, []);
//   // ── Deduplication ──────────────────────────────────────────────────────────
//   const getKey = useCallback((item) =>
//     item.notification_key ||
//     `${item.id}|${item.title}|${item.type}|${item.metadata?.job_id || ""}`, []);

//   const dedupe = useCallback((items) =>
//     Array.from(new Map(items.map((i) => [getKey(i), i])).values()), [getKey]);

//   // ── Browser helpers ────────────────────────────────────────────────────────
//   const playSound = () => {
//     try {
//       const ctx = new (window.AudioContext || window.webkitAudioContext)();
//       const osc = ctx.createOscillator();
//       const gain = ctx.createGain();
//       osc.connect(gain); gain.connect(ctx.destination);
//       osc.frequency.value = 880; gain.gain.value = 0.1;
//       osc.start(); osc.stop(ctx.currentTime + 0.12);
//     } catch {}
//   };

//   const showBrowserNotif = (title, body) => {
//     if (Notification?.permission === "granted") {
//       new Notification(title || "Notification", { body });
//     }
//   };

//   // ── Core load ──────────────────────────────────────────────────────────────
//   const loadNotifications = useCallback(async () => {
//     if (!userId || !token) return;
//     try {
//       const [notifRes, countRes] = await Promise.all([
//         fetchNotifications(userId, token),
//         fetchUnreadCount(userId, token),
//       ]);
//       if (!isMountedRef.current) return;

//       const items = dedupe(Array.isArray(notifRes.notifications) ? notifRes.notifications : []);
//       setNotifications(items);
//       setUnreadCount(Number(countRes.unread_count) || 0);

//       // Detect truly new unread notifications
//       if (!firstLoadRef.current) {
//         const newItems = items.filter((n) => !previousIdsRef.current.has(n.id) && !n.is_read);
//         if (newItems.length > 0) {
//           setLatestMessage(newItems[0].title || "New notification");
//           playSound();
//           showBrowserNotif(newItems[0].title, newItems[0].message);
//         }
//       }
//       previousIdsRef.current = new Set(items.map((n) => n.id));
//       firstLoadRef.current = false;
//     } catch (err) {
//       console.error("Notification load error:", err);
//     }
//   }, [userId, token, dedupe]);

//   // ── Initial load ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     isMountedRef.current = true;
//     if (userId && token) {
//       Notification?.requestPermission?.().catch(() => {});
//       loadNotifications();
//     }
//     return () => { isMountedRef.current = false; };
//   }, [loadNotifications, userId, token]);

//   // ── Realtime subscription (replaces setInterval) ───────────────────────────
//   useRealtimeInsert(
//     "notifications",
//     (newRow) => {
//       // Only react to this user's notifications
//       if (!userId || newRow.user_id !== userId) return;
//       loadNotifications();
//     },
//     userId ? `user_id=eq.${userId}` : null,
//     [userId]
//   );

//   // ── Outside click ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const handler = (e) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   // ── Tab title badge ────────────────────────────────────────────────────────
//   useEffect(() => {
//     document.title = unreadCount > 0
//       ? `(${unreadCount}) ${originalTitleRef.current}`
//       : originalTitleRef.current;
//     return () => { document.title = originalTitleRef.current; };
//   }, [unreadCount]);

//   useEffect(() => {
//     if (!latestMessage) return;
//     const t = setTimeout(() => setLatestMessage(""), 4000);
//     return () => clearTimeout(t);
//   }, [latestMessage]);

//   // ── Actions ────────────────────────────────────────────────────────────────
//   const handleRead = async (id, isRead) => {
//     if (isRead || isBusyRef.current || !token) return;
//     setNotifications((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n));
//     setUnreadCount((p) => Math.max(0, p - 1));
//     try { await markNotificationRead(id, token); } catch { loadNotifications(); }
//   };

//   const handleReadAll = async () => {
//     if (!userId || !token || isBusyRef.current) return;
//     isBusyRef.current = true;
//     setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
//     setUnreadCount(0); setLatestMessage("");
//     try { await markAllNotificationsRead(userId, token); await loadNotifications(); }
//     catch { await loadNotifications(); }
//     finally { isBusyRef.current = false; }
//   };

//   const handleDelete = async (e, id) => {
//     e.stopPropagation();
//     if (!token || isBusyRef.current) return;
//     isBusyRef.current = true;
//     const item = notifications.find((n) => n.id === id);
//     setNotifications((p) => p.filter((n) => n.id !== id));
//     if (item && !item.is_read) setUnreadCount((p) => Math.max(0, p - 1));
//     setLatestMessage("");
//     try { await deleteNotification(id, token); await loadNotifications(); }
//     catch { await loadNotifications(); }
//     finally { isBusyRef.current = false; }
//   };

//   const handleClearAll = async () => {
//     if (!userId || !token || isBusyRef.current) return;
//     isBusyRef.current = true;
//     setNotifications([]); setUnreadCount(0);
//     setLatestMessage(""); firstLoadRef.current = true;
//     try { await clearAllNotifications(userId, token); await loadNotifications(); }
//     catch { await loadNotifications(); }
//     finally { isBusyRef.current = false; }
//   };

//   // ── Helpers ────────────────────────────────────────────────────────────────
//   const formatDate = (v) => {
//     if (!v) return "";
//     const d = new Date(v);
//     return isNaN(d) ? "" : d.toLocaleString();
//   };

//   const borderColor = (type) => ({
//     ERROR: "#ef4444", SUCCESS: "#22c55e", WARNING: "#f59e0b"
//   }[String(type || "").toUpperCase()] || "#3b82f6");

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <div ref={wrapperRef} style={{ position: "relative" }}>
//       <button
//         onClick={() => setOpen((p) => !p)}
//         title="Notifications"
//         style={{
//           background: "transparent", border: "1px solid rgba(255,255,255,0.10)",
//           color: "#d4d4d8", fontSize: "18px", cursor: "pointer",
//           position: "relative", width: "38px", height: "38px", borderRadius: "10px",
//         }}
//       >
//         🔔
//         {unreadCount > 0 && (
//           <span style={{
//             position: "absolute", top: "-6px", right: "-6px",
//             background: "#ef4444", color: "white", borderRadius: "999px",
//             minWidth: "18px", height: "18px", padding: "0 5px",
//             fontSize: "11px", fontWeight: "bold",
//             display: "flex", alignItems: "center", justifyContent: "center",
//           }}>
//             {unreadCount > 99 ? "99+" : unreadCount}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div style={{
//           position: "absolute", right: 0, top: "46px", width: "360px",
//           maxHeight: "420px", overflowY: "auto", background: "#111111",
//           color: "#f4f4f5", border: "1px solid rgba(255,255,255,0.10)",
//           borderRadius: "12px", boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
//           zIndex: 1000, padding: "12px",
//         }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
//             <h4 style={{ margin: 0, fontSize: "15px" }}>Notifications</h4>
//             <div style={{ display: "flex", gap: "8px" }}>
//               <button onClick={handleReadAll} style={{ background: "rgba(255,255,255,0.06)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px" }}>
//                 Mark all read
//               </button>
//               <button onClick={handleClearAll} style={{ background: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px" }}>
//                 Clear all
//               </button>
//             </div>
//           </div>

//           {latestMessage && (
//             <div style={{ marginBottom: "10px", padding: "10px", borderRadius: "8px", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.30)", color: "#86efac", fontSize: "13px" }}>
//               {latestMessage}
//             </div>
//           )}

//           {notifications.length === 0
//             ? <p style={{ margin: 0, color: "#a1a1aa", fontSize: "14px" }}>No notifications yet.</p>
//             : notifications.map((n) => (
//               <div
//                 key={n.notification_key || n.id}
//                 onClick={() => handleRead(n.id, n.is_read)}
//                 style={{
//                   padding: "10px", marginBottom: "8px", borderRadius: "10px",
//                   cursor: "pointer", position: "relative",
//                   background: n.is_read ? "rgba(255,255,255,0.04)" : "rgba(59,130,246,0.10)",
//                   borderLeft: `4px solid ${borderColor(n.type)}`,
//                   border: "1px solid rgba(255,255,255,0.06)",
//                 }}
//               >
//                 <button onClick={(e) => handleDelete(e, n.id)} title="Remove" style={{ position: "absolute", top: "6px", right: "6px", background: "transparent", border: "none", color: "#a1a1aa", fontSize: "14px", cursor: "pointer" }}>✖</button>
//                 <strong style={{ display: "block", marginBottom: "4px", paddingRight: "20px" }}>{n.title}</strong>
//                 <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#d4d4d8", lineHeight: 1.4, paddingRight: "20px" }}>{n.message}</p>
//                 <small style={{ color: "#a1a1aa" }}>{formatDate(n.created_at)}</small>
//               </div>
//             ))
//           }
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../utils/notificationApi";
import { useRealtimeInsert } from "../hooks/useSupabaseRealtime";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [latestMessage, setLatestMessage] = useState("");
  const [userId, setUserId] = useState(null);

  const wrapperRef = useRef(null);
  const originalTitleRef = useRef(document.title);
  const isBusyRef = useRef(false);

  // ── Load session safely ─────────────────────────────────────
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("cloudcrafter_session"));
      setUserId(session?.user_id);
    } catch {
      setUserId(null);
    }
  }, []);

  // ── Browser helpers ─────────────────────────────────────────
  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const showBrowserNotif = (title, body) => {
    if (Notification?.permission === "granted") {
      new Notification(title || "Notification", { body });
    }
  };

  // ── Load notifications ─────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);

      const items = notifRes.notifications || [];

      setNotifications(items);
      setUnreadCount(countRes.unread_count || 0);
    } catch (err) {
      console.error("Notification load error:", err);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    Notification?.requestPermission?.().catch(() => {});
    loadNotifications();
  }, [userId, loadNotifications]);

  // ── Realtime updates ───────────────────────────────────────
  useRealtimeInsert(
    "notifications",
    (newRow) => {
      if (!userId || newRow.user_id !== userId) return;

      // 🔥 Instant UI update
      setNotifications((prev) => [newRow, ...prev]);
      setUnreadCount((prev) => prev + 1);

      setLatestMessage(newRow.title || "New notification");
      playSound();
      showBrowserNotif(newRow.title, newRow.message);
    },
    userId ? `user_id=eq.${userId}` : null,
    [userId]
  );

  // ── Outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Tab title badge ────────────────────────────────────────
  useEffect(() => {
    document.title =
      unreadCount > 0
        ? `(${unreadCount}) ${originalTitleRef.current}`
        : originalTitleRef.current;

    return () => {
      document.title = originalTitleRef.current;
    };
  }, [unreadCount]);

  // ── Clear latest toast message ─────────────────────────────
  useEffect(() => {
    if (!latestMessage) return;
    const t = setTimeout(() => setLatestMessage(""), 4000);
    return () => clearTimeout(t);
  }, [latestMessage]);

  // ── Actions ────────────────────────────────────────────────
  const handleRead = async (id, isRead) => {
    if (isRead || isBusyRef.current) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(id);
    } catch {
      loadNotifications();
    }
  };

  const handleReadAll = async () => {
    if (isBusyRef.current) return;

    isBusyRef.current = true;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
      loadNotifications();
    } finally {
      isBusyRef.current = false;
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (isBusyRef.current) return;

    isBusyRef.current = true;

    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteNotification(id);
      loadNotifications();
    } finally {
      isBusyRef.current = false;
    }
  };

  const handleClearAll = async () => {
    if (isBusyRef.current) return;

    isBusyRef.current = true;

    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications();
      loadNotifications();
    } finally {
      isBusyRef.current = false;
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const formatDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? "" : d.toLocaleString();
  };

  const borderColor = (type) => {
    const map = {
      ERROR: "#ef4444",
      SUCCESS: "#22c55e",
      WARNING: "#f59e0b",
    };
    return map[String(type || "").toUpperCase()] || "#3b82f6";
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
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
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleReadAll}>Mark all read</button>
              <button onClick={handleClearAll}>Clear all</button>
            </div>
          </div>

          {latestMessage && <div>{latestMessage}</div>}

          {notifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRead(n.id, n.is_read)}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "10px",
                  background: n.is_read ? "#222" : "#1e293b",
                  cursor: "pointer",
                }}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{formatDate(n.created_at)}</small>
                <button onClick={(e) => handleDelete(e, n.id)}>✖</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}