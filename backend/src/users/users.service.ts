import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user
      .findMany({
        include: {
          role: { select: { id: true, name: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: { name: 'asc' },
      })
      .then((users) =>
        users.map((user) => ({
          id: user.id,
          name: user.name,
          roleId: user.roleId,
          role: user.role.name,
          _count: user._count,
        })),
      );
  }

  listAssignableRoles() {
    return this.prisma.role
      .findMany({
        select: {
          id: true,
          name: true,
          permissions: { select: { action: true }, orderBy: { action: 'asc' } },
        },
        orderBy: { name: 'asc' },
      })
      .then((roles) =>
        roles.map((role) => ({
          id: role.id,
          name: role.name,
          permissions: role.permissions.map((permission) => permission.action),
        })),
      );
  }

  async createUser(payload: CreateUserDto) {
    await this.assertRoleExists(payload.roleId);
    this.logger.log(`Creating user with roleId=${payload.roleId}`);
    return this.prisma.user
      .create({
        data: payload,
        include: { role: { select: { id: true, name: true } } },
      })
      .then((user) => ({
        id: user.id,
        name: user.name,
        roleId: user.roleId,
        role: user.role.name,
      }));
  }

  async updateUserRole(id: string, payload: UpdateUserRoleDto) {
    await this.assertUserExists(id);
    await this.assertRoleExists(payload.roleId);
    this.logger.log(`Updating role for user=${id} roleId=${payload.roleId}`);
    return this.prisma.user
      .update({
        where: { id },
        data: { roleId: payload.roleId },
        include: { role: { select: { id: true, name: true } } },
      })
      .then((user) => ({
        id: user.id,
        name: user.name,
        roleId: user.roleId,
        role: user.role.name,
      }));
  }

  async deleteUser(id: string) {
    await this.assertUserExists(id);
    this.logger.log(`Deleting user=${id} with cascade bookings delete.`);
    return this.prisma.user.delete({ where: { id } });
  }

  private async assertUserExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async assertRoleExists(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }
  }
}
