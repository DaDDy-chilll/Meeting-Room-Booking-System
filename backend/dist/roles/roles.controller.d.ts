import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    listRoles(): Promise<{
        id: string;
        name: string;
        permissions: string[];
    }[]>;
    getAvailablePermissions(): readonly ["booking:create", "booking:view", "booking:delete:own", "booking:delete:any", "booking:view:grouped", "booking:view:summary", "user:create", "user:view", "user:delete", "user:update-role", "role:create", "role:view", "role:update-permissions", "role:delete"];
    createRole(payload: CreateRoleDto): Promise<{
        id: string;
        name: string;
        permissions: string[];
    }>;
    updatePermissions(roleId: string, payload: UpdateRolePermissionsDto): Promise<{
        id: string;
        name: string;
        permissions: string[];
    }>;
    deleteRole(roleId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
