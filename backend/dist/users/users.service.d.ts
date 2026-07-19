import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listUsers(): Promise<{
        id: string;
        name: string;
        roleId: string;
        role: string;
        _count: {
            bookings: number;
        };
    }[]>;
    listAssignableRoles(): Promise<{
        id: string;
        name: string;
        permissions: string[];
    }[]>;
    createUser(payload: CreateUserDto): Promise<{
        id: string;
        name: string;
        roleId: string;
        role: string;
    }>;
    updateUserRole(id: string, payload: UpdateUserRoleDto): Promise<{
        id: string;
        name: string;
        roleId: string;
        role: string;
    }>;
    deleteUser(id: string): Promise<{
        name: string;
        roleId: string;
        id: string;
    }>;
    private assertUserExists;
    private assertRoleExists;
}
