export type AdminRole =
  | 'super_admin'
  | 'moderator'
  | 'finance_admin'
  | 'support_admin'
  | 'compliance_officer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AdminSession {
  user: AdminUser;
  expiresAt: Date;
}
