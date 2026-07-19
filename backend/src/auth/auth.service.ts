import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  listActors() {
    return this.prisma.user
      .findMany({
        select: {
          id: true,
          name: true,
          roleId: true,
          role: {
            select: {
              name: true,
              permissions: {
                select: { action: true },
                orderBy: { action: 'asc' },
              },
            },
          },
        },
        orderBy: [{ role: { name: 'asc' } }, { name: 'asc' }],
      })
      .then((users) =>
        users.map((user) => ({
          id: user.id,
          name: user.name,
          roleId: user.roleId,
          role: user.role.name,
          permissions: user.role.permissions.map(
            (permission) => permission.action,
          ),
        })),
      );
  }
}
