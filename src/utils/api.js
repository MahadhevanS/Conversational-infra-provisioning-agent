const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("cloudcrafter_token", token);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem("cloudcrafter_token");
};

export const clearAuthToken = () => {
  localStorage.removeItem("cloudcrafter_token");
  localStorage.removeItem("cloudcrafter_session");
};

/* ✅ FIXED: TRUE AUTH CHECK */
export const validateSession = () => {
  const token = getAuthToken();

  if (!token) {
    console.warn("🔴 No token found");
    return false;
  }

  return true;
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    /* ✅ FIXED: smarter 401 handling */
    if (response.status === 401) {
      console.error("🚨 401 Unauthorized");

      clearAuthToken();

      sessionStorage.setItem("session_expired", "true");

      // delay prevents race-condition flicker
      setTimeout(() => {
        window.location.href = "/signin";
      }, 100);

      throw new Error("Session expired");
    }

    if (!response.ok) {
      let errorMsg = "API request failed";
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {
        errorMsg = await response.text();
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
};