import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthContextMiddleware implements NestMiddleware {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    use(req: Request, _res: Response, next: NextFunction): Promise<void>;
}
