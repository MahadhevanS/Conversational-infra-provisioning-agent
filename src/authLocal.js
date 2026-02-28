const USERS_KEY = "cloudcrafter_users";
const SESSION_KEY = "cloudcrafter_session";

/* --------------------------------------------------
   DEFAULT TEAM ACCOUNT (shared login)
   You can change email/password here anytime
---------------------------------------------------*/
const DEFAULT_USER = {
  full_name: "CloudCrafter Team",
  email: "team@cloudcrafter.com",
  password: "team12345",
  aws: {
    aws_account_id: "060623762364",
    aws_region: "us-east-1",
    role_arn: "arn:aws:iam::12384793393:role/CloudCrafter-Access",
    external_id: "EXTERNAL_ID"
  }
};

/* Ensure default user always exists */
function ensureDefaultUser(users) {
  const exists = users.some(
    (u) => u.email.toLowerCase() === DEFAULT_USER.email.toLowerCase()
  );

  if (!exists) {
    users.push(DEFAULT_USER);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}

/* ---------------- USERS ---------------- */

export function getUsers() {
  let users = [];

  try {
    users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    users = [];
  }

  // 🔴 IMPORTANT: automatically create team login
  users = ensureDefaultUser(users);

  return users;
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signupLocal(user) {
  const users = getUsers();

  const exists = users.some(
    (u) => u.email.toLowerCase() === user.email.toLowerCase()
  );

  if (exists) throw new Error("Email already registered. Please Sign In.");

  users.push(user);
  saveUsers(users);
  return true;
}

/* ---------------- LOGIN ---------------- */

/* ---------------- LOGIN ---------------- */
export const loginLocal = (email, password) => {
  // 🔴 FIX: Use USERS_KEY ("cloudcrafter_users") instead of the hardcoded string "users"
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    // This saves the full user object including the .aws property
    localStorage.setItem("activeUser", JSON.stringify(user));
    
    // Also set the session key used by getSession() and isLoggedIn()
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, ts: Date.now() }));
    
    return user;
  } else {
    throw new Error("Invalid credentials");
  }
};
/* ---------------- SESSION ---------------- */

export function logoutLocal() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getSession();
}