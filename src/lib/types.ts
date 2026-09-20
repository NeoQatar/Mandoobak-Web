export type User = {
  id?: string;
  userid: string;
  name: string;
  phoneNumber: string;
  phone?: string; // For UI compatibility
  email: string;
  type: 'admin' | 'manager' | 'vendor' | 'customer';
  createdAt?: string; // ISO string format
  profileImageUrl?: string;
  city?: string;
  status?: 'Active' | 'Inactive';
  processingServices?: number;
  completedServices?: number;
  percentage?: number;
  crDocUrl?: string;
  cpDocUrl?: string;
  eidDocUrl?: string;
  mouDocUrl?: string;
  permissions?: string[]; // module-level permissions for admin/manager
};

export const ALL_PERMISSIONS = [
  { key: 'orders',        label: 'Orders Management' },
  { key: 'services',      label: 'Services Management' },
  { key: 'vendors',       label: 'Vendors Management' },
  { key: 'users',         label: 'Users Management' },
  { key: 'departments',   label: 'Departments & Categories' },
  { key: 'reports',       label: 'Reports & Analytics' },
  { key: 'finance',       label: 'Finance & Payments' },
  { key: 'activity_logs', label: 'Activity Logs' },
  { key: 'settings',      label: 'Settings' },
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number]['key'];
