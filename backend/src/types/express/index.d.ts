import type { Actor } from '../../common/interfaces/actor.interface';

declare module 'express-serve-static-core' {
  interface Request {
    actor?: Actor;
  }
}
