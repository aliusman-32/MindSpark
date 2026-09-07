// Centralizes where the logged-in user/token live, so "Remember me" actually
// means something: checked -> localStorage (survives closing the browser),
// unchecked -> sessionStorage (cleared when the tab/browser closes).

const USER_KEY = 'mindspark_user';
const TOKEN_KEY = 'mindspark_token';

export function saveSession({ user, token, remember }) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  try {
    store.setItem(USER_KEY, JSON.stringify(user));
    if (token) store.setItem(TOKEN_KEY, token);
    other.removeItem(USER_KEY);
    other.removeItem(TOKEN_KEY);
  } catch (e) {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}
