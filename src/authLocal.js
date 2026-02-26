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
    aws_account_id: "123456789012",
    aws_region: "ap-south-1",
    role_arn: "arn:aws:iam::123456789012:role/CloudCrafterRole",
    external_id: ""
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

export function loginLocal(email, password) {
  const users = getUsers();

  const found = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!found) throw new Error("Invalid email or password");

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      email: found.email,
      full_name: found.full_name,
      aws: found.aws
    })
  );

  return found;
}

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