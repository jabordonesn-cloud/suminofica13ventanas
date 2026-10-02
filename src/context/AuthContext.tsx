import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  register: (username: string, password: string, role: UserRole) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface StoredUser {
  username: string;
  password: string;
  role: UserRole;
}

const defaultUsers: StoredUser[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'cajero', password: 'cajero123', role: 'cajero' },
];

function getStoredUsers(): StoredUser[] {
  const raw = localStorage.getItem('erp_users');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through
    }
  }
  localStorage.setItem('erp_users', JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem('erp_users', JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('erp_current_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const users = getStoredUsers();
    const found = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password,
    );
    if (!found) {
      return { success: false, error: 'Usuario o clave incorrectos' };
    }
    const authUser: AuthUser = { username: found.username, role: found.role };
    setUser(authUser);
    localStorage.setItem('erp_current_user', JSON.stringify(authUser));
    return { success: true };
  };

  const register = (
    username: string,
    password: string,
    role: UserRole,
  ): { success: boolean; error?: string } => {
    if (username.trim().length < 3) {
      return { success: false, error: 'El usuario debe tener al menos 3 caracteres' };
    }
    if (password.length < 5) {
      return { success: false, error: 'La clave debe tener al menos 5 caracteres' };
    }
    const users = getStoredUsers();
    const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return { success: false, error: 'Este usuario ya existe' };
    }
    const newUser: StoredUser = { username, password, role };
    users.push(newUser);
    saveStoredUsers(users);
    const authUser: AuthUser = { username, role };
    setUser(authUser);
    localStorage.setItem('erp_current_user', JSON.stringify(authUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
