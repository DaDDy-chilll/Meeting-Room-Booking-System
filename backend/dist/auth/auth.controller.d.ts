import type { Actor } from '../common/interfaces/actor.interface';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getActors(): Promise<{
        id: string;
        name: string;
        roleId: string;
        role: string;
        permissions: string[];
    }[]>;
    getCurrentActor(actor: Actor): Actor;
}
