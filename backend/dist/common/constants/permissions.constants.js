"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ROLE_PERMISSIONS = exports.APP_PERMISSIONS = void 0;
exports.APP_PERMISSIONS = [
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
];
exports.DEFAULT_ROLE_PERMISSIONS = {
    admin: [...exports.APP_PERMISSIONS],
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
//# sourceMappingURL=permissions.constants.js.map