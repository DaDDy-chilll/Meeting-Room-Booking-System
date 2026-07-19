export const APP_PERMISSIONS = [
  'booking:create',
  'booking:view',
  'booking:delete:own',
  'booking:delete:any',
  'booking:view:grouped',
  'booking:view:summary',
  'user:create',
  'user:view',
  'user:delete',
  'user:update-role',
  'role:create',
  'role:view',
  'role:update-permissions',
  'role:delete',
] as const;

export type AppPermission = (typeof APP_PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
  admin: [...APP_PERMISSIONS],
  owner: [
    'booking:create',
    'booking:view',
    'booking:delete:own',
    'booking:delete:any',
    'booking:view:grouped',
    'booking:view:summary',
    'role:view',
  ],
  user: ['booking:create', 'booking:view', 'booking:delete:own', 'role:view'],
};
