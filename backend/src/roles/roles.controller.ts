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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RolesService } from './roles.service';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('role:view')
  listRoles() {
    return this.rolesService.listRoles();
  }

  @Get('permissions/available')
  @Permissions('role:view')
  getAvailablePermissions() {
    return this.rolesService.getAvailablePermissions();
  }

  @Post()
  @Permissions('role:create')
  createRole(@Body() payload: CreateRoleDto) {
    return this.rolesService.createRole(payload);
  }

  @Patch(':id/permissions')
  @Permissions('role:update-permissions')
  updatePermissions(
    @Param('id') roleId: string,
    @Body() payload: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updatePermissions(roleId, payload);
  }

  @Delete(':id')
  @Permissions('role:delete')
  deleteRole(@Param('id') roleId: string) {
    return this.rolesService.deleteRole(roleId);
  }
}
