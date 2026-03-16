const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getAuthToken = () => {
  return localStorage.getItem("cloudcrafter_token");
};

export const setAuthToken = (token) => {
  localStorage.setItem("cloudcrafter_token", token);
};

export const clearAuthToken = () => {
  // Clear Auth Tokens
  localStorage.removeItem("cloudcrafter_token");
  localStorage.removeItem("cloudcrafter_session");
  
  // Clear Project Data
  localStorage.removeItem("cloudcrafter_project_id");
  sessionStorage.removeItem("cc_project_id"); // 🔥 Added this to ensure clean slate
};

export const setProjectId = (id) => {
  localStorage.setItem("cloudcrafter_project_id", id);
};

export const getProjectId = () => {
  return localStorage.getItem("cloudcrafter_project_id");
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  // 🔥 Automatically inject ngrok bypass and JSON headers to EVERY call
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  };

  // Inject Authorization Bearer token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 🔥 THE 401 INTERCEPTOR
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
      } catch (e) {
        errorMsg = await response.text();
      }
      throw new Error(errorMsg);
    }

    return await response.json();
    
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error; // Re-throw to be caught by the component UI
  }
};