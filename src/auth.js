// Simple login session handler

export const isLoggedIn = () => {
  return localStorage.getItem("cloudcrafter_user") !== null;
};

export const login = (email) => {
  localStorage.setItem("cloudcrafter_user", email);
};

export const logout = () => {
  localStorage.removeItem("cloudcrafter_user");
};