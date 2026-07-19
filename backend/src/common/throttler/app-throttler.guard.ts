import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const actor = req.actor as { id?: string } | undefined;
    const ips = req.ips;
    const socket = req.socket as { remoteAddress?: string } | undefined;

    const actorId = actor?.id ?? 'anonymous';
    const ipAddress =
      (typeof req.ip === 'string' ? req.ip : undefined) ??
      (Array.isArray(ips) && typeof ips[0] === 'string' ? ips[0] : undefined) ??
      socket?.remoteAddress ??
      'unknown';

    return Promise.resolve(`${ipAddress}:${actorId}`);
  }
}
