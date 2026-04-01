import { adminClient } from './client';

export interface SystemSetting {
  id: string;
  key: string;
  value: string | number | boolean;
  category: string;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SettingsResponse {
  general: SystemSetting[];
  moderation: SystemSetting[];
  monetization: SystemSetting[];
  streaming: SystemSetting[];
  compliance: SystemSetting[];
}

export interface UpdateSettingsData {
  settings: Array<{
    key: string;
    value: string | number | boolean;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator' | 'finance_admin' | 'support_admin' | 'compliance_officer';
  createdAt: string;
}

export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'moderator' | 'finance_admin' | 'support_admin' | 'compliance_officer';
}

export interface UpdateAdminRoleData {
  role: 'super_admin' | 'moderator' | 'finance_admin' | 'support_admin' | 'compliance_officer';
}

export const settingsApi = {
  getSettings: async (): Promise<SettingsResponse> => {
    const response = await adminClient.get('/api/admin/settings');
    return response.data;
  },

  updateSettings: async (data: UpdateSettingsData): Promise<void> => {
    await adminClient.patch('/api/admin/settings', data);
  },

  listAdmins: async (): Promise<AdminUser[]> => {
    const response = await adminClient.get('/api/admin/settings/admins');
    return response.data;
  },

  createAdmin: async (data: CreateAdminData): Promise<AdminUser> => {
    const response = await adminClient.post('/api/admin/settings/admins', data);
    return response.data;
  },

  updateAdminRole: async (id: string, data: UpdateAdminRoleData): Promise<void> => {
    await adminClient.patch(`/api/admin/settings/admins/${id}/role`, data);
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await adminClient.delete(`/api/admin/settings/admins/${id}`);
  },
};
