const AUTH_STORAGE_KEY = 'verifyai_auth';
const USER_STORAGE_KEY = 'verifyai_user';
const USERS_STORAGE_KEY = 'verifyai_users';

type PersistenceMode = 'local' | 'session';

export interface AuthUser {
  name: string;
  email: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

function getStoredUsers(): StoredUser[] {
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

const getStorage = (mode: PersistenceMode) =>
  mode === 'local' ? window.localStorage : window.sessionStorage;

export function setAuthenticated(rememberUser: boolean, user?: Partial<AuthUser>) {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.sessionStorage.removeItem(USER_STORAGE_KEY);

  const storage = getStorage(rememberUser ? 'local' : 'session');
  storage.setItem(AUTH_STORAGE_KEY, 'true');

  if (user && (user.name || user.email)) {
    const payload: AuthUser = {
      name: String(user.name || '').trim(),
      email: String(user.email || '').trim(),
    };
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
  }
}

export function registerUser(payload: { name: string; email: string; password: string }) {
  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  const password = String(payload.password || '');

  if (!email || !password) {
    return { success: false, reason: 'Email and password are required.' } as const;
  }

  const users = getStoredUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email);
  if (exists) {
    return { success: false, reason: 'Account already exists. Please sign in.' } as const;
  }

  users.push({ name, email, password });
  saveStoredUsers(users);
  return { success: true, user: { name, email } } as const;
}

export function validateCredentials(emailInput: string, passwordInput: string) {
  const email = String(emailInput || '').trim().toLowerCase();
  const password = String(passwordInput || '');
  const users = getStoredUsers();

  const matched = users.find((u) => u.email.toLowerCase() === email);
  if (!matched) {
    return { success: false, reason: 'No account found for this email.' } as const;
  }

  if (matched.password !== password) {
    return { success: false, reason: 'Invalid password.' } as const;
  }

  return {
    success: true,
    user: {
      name: matched.name,
      email: matched.email,
    },
  } as const;
}

export function updateAuthenticatedUser(user: Partial<AuthUser>) {
  const currentStorage = window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
    ? window.localStorage
    : window.sessionStorage;

  const existing = getAuthenticatedUser();
  const payload: AuthUser = {
    name: String(user.name ?? existing?.name ?? '').trim(),
    email: String(user.email ?? existing?.email ?? '').trim(),
  };

  if (payload.name || payload.email) {
    currentStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
  }
}

export function getAuthenticatedUser(): AuthUser | null {
  const raw = window.localStorage.getItem(USER_STORAGE_KEY) || window.sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      name: String(parsed?.name || '').trim(),
      email: String(parsed?.email || '').trim(),
    };
  } catch {
    return null;
  }
}

export function clearAuthentication() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.sessionStorage.removeItem(USER_STORAGE_KEY);
}

export function isAuthenticated() {
  return (
    window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true' ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  );
}

export function checkLocalCurrentPassword(emailInput: string, currentPassword: string) {
  const email = String(emailInput || '').trim().toLowerCase();
  const password = String(currentPassword || '');
  const users = getStoredUsers();
  const matched = users.find((u) => u.email.toLowerCase() === email);

  if (!matched) {
    return { knownUser: false, valid: true } as const;
  }

  return { knownUser: true, valid: matched.password === password } as const;
}

export function updateLocalPassword(emailInput: string, newPassword: string) {
  const email = String(emailInput || '').trim().toLowerCase();
  const password = String(newPassword || '');
  if (!email || !password) return;

  const users = getStoredUsers();
  const updatedUsers = users.map((user) => (
    user.email.toLowerCase() === email
      ? { ...user, password }
      : user
  ));

  saveStoredUsers(updatedUsers);
}

export function deleteLocalAccount(emailInput: string) {
  const email = String(emailInput || '').trim().toLowerCase();
  if (!email) return;

  const users = getStoredUsers();
  const filteredUsers = users.filter((user) => user.email.toLowerCase() !== email);
  saveStoredUsers(filteredUsers);

  const currentUser = getAuthenticatedUser();
  if (currentUser?.email?.toLowerCase() === email) {
    clearAuthentication();
  }
}