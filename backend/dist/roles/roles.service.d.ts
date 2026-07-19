import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
export declare class RolesService {
    private readonly prisma;
    private readonly logger;
    private readonly protectedRoleNames;
    constructor(prisma: PrismaService);
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
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private assertValidPermissions;
    private assertRoleExists;
}
