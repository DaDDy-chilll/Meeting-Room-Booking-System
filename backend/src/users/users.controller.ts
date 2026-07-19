import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../common/decorators/roles.decorator';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { PermissionsGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user:view')
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get('roles')
  @Permissions('role:view')
  listAssignableRoles() {
    return this.usersService.listAssignableRoles();
  }

  @Post()
  @Permissions('user:create')
  createUser(@Body() payload: CreateUserDto) {
    return this.usersService.createUser(payload);
  }

  @Patch(':id/role')
  @Permissions('user:update-role')
  updateUserRole(@Param('id') id: string, @Body() payload: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, payload);
  }

  @Delete(':id')
  @Permissions('user:delete')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
