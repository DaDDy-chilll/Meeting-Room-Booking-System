import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listActors(): Promise<{
        id: string;
        name: string;
        roleId: string;
        role: string;
        permissions: string[];
    }[]>;
}
