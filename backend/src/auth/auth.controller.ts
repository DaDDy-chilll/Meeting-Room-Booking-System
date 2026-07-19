import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import type { Actor } from '../common/interfaces/actor.interface';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('actors')
  getActors() {
    return this.authService.listActors();
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  getCurrentActor(@CurrentActor() actor: Actor) {
    return actor;
  }
}
