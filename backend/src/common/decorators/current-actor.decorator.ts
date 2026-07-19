import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Actor } from '../interfaces/actor.interface';

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.actor;
  },
);
