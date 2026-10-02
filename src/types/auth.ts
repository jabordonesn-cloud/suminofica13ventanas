import type { LucideIcon } from 'lucide-react';

export type UserRole = 'admin' | 'cajero';

export interface AuthUser {
  username: string;
  role: UserRole;
}

export interface NavItem {
  id: number;
  label: string;
  path: string;
  icon: LucideIcon;
  adminOnly: boolean;
  description: string;
}
