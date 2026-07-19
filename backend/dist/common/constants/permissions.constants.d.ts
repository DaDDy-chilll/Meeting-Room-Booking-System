export declare const APP_PERMISSIONS: readonly ["booking:create", "booking:view", "booking:delete:own", "booking:delete:any", "booking:view:grouped", "booking:view:summary", "user:create", "user:view", "user:delete", "user:update-role", "role:create", "role:view", "role:update-permissions", "role:delete"];
export type AppPermission = (typeof APP_PERMISSIONS)[number];
export declare const DEFAULT_ROLE_PERMISSIONS: Record<string, AppPermission[]>;
