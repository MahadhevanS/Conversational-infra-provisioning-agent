const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function buildHeaders(token, includeJson = false) {
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseJsonResponse(res, fallbackMessage) {
  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      fallbackMessage ||
      "Request failed";
    throw new Error(message);
  }

  return data ?? {};
}

async function apiRequest(url, options = {}, fallbackMessage = "Request failed") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      signal: controller.signal,
    });

    return await parseJsonResponse(res, fallbackMessage);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchNotifications(userId, token) {
  if (!userId) {
    return { success: true, notifications: [] };
  }

  const data = await apiRequest(
    `${API_BASE}/notifications?user_id=${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: buildHeaders(token),
    },
    "Failed to fetch notifications"
  );

  return {
    success: true,
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
  };
}

export async function fetchUnreadCount(userId, token) {
  if (!userId) {
    return { success: true, unread_count: 0 };
  }

  const data = await apiRequest(
    `${API_BASE}/notifications/unread-count?user_id=${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: buildHeaders(token),
    },
    "Failed to fetch unread count"
  );

  return {
    success: true,
    unread_count: Number(data.unread_count) || 0,
  };
}

export async function markNotificationRead(notificationId, token) {
  if (!notificationId) {
    throw new Error("Notification ID is required");
  }

  return apiRequest(
    `${API_BASE}/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PUT",
      headers: buildHeaders(token),
    },
    "Failed to mark notification as read"
  );
}

export async function markAllNotificationsRead(userId, token) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return apiRequest(
    `${API_BASE}/notifications/read-all?user_id=${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: buildHeaders(token),
    },
    "Failed to mark all notifications as read"
  );
}

export async function createNotification(payload, token) {
  if (!payload) {
    throw new Error("Notification payload is required");
  }

  return apiRequest(
    `${API_BASE}/notifications`,
    {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    },
    "Failed to create notification"
  );
}

export async function deleteNotification(notificationId, token) {
  if (!notificationId) {
    throw new Error("Notification ID is required");
  }

  return apiRequest(
    `${API_BASE}/notifications/${encodeURIComponent(notificationId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(token),
    },
    "Failed to delete notification"
  );
}

export async function clearAllNotifications(userId, token) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return apiRequest(
    `${API_BASE}/notifications/clear-all?user_id=${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(token),
    },
    "Failed to clear notifications"
  );
}