const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ---------------- TOKEN HELPERS ---------------- */

export const getAuthToken = () => {
  return localStorage.getItem("cloudcrafter_token");
};

export const setAuthToken = (token) => {
  localStorage.setItem("cloudcrafter_token", token);
};

export const getUserId = () => {
  return localStorage.getItem("user_id");
};

export const setUserId = (userId) => {
  localStorage.setItem("user_id", userId);
};

export const clearAuthToken = () => {
  localStorage.removeItem("cloudcrafter_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("cloudcrafter_session");
  localStorage.removeItem("cloudcrafter_project_id");
  sessionStorage.removeItem("cc_project_id");
};

export const setProjectId = (id) => {
  localStorage.setItem("cloudcrafter_project_id", id);
};

export const getProjectId = () => {
  return localStorage.getItem("cloudcrafter_project_id");
};

/* ---------------- API FETCH ---------------- */

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        clearAuthToken();
        window.location.href = "/signin";
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        let errorMsg = "API request failed";

        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch {
          try {
            errorMsg = await response.text();
          } catch {
            errorMsg = "API request failed";
          }
        }

        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed for ${endpoint}:`, error.message);

      if (attempt === MAX_RETRIES) {
        console.error(`❌ API failed after ${MAX_RETRIES} attempts:`, endpoint);
        throw error;
      }

      await new Promise((res) => setTimeout(res, attempt * 1000));
    }
  }
};