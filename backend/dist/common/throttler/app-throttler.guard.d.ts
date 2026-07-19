import { ThrottlerGuard } from '@nestjs/throttler';
export declare class AppThrottlerGuard extends ThrottlerGuard {
    protected getTracker(req: Record<string, unknown>): Promise<string>;
}
