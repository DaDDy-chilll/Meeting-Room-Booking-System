import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
}
