import type { Actor } from '../common/interfaces/actor.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listBookings(): Promise<{
        user: {
            id: string;
            name: string;
            roleId: string;
            role: string;
            permissions: never[];
        };
        id: string;
        createdAt: Date;
        userId: string;
        startTime: Date;
        endTime: Date;
    }[]>;
    private transformBooking;
    private loadBookingWithUser;
    createBooking(actor: Actor, payload: CreateBookingDto): Promise<{
        user: {
            id: string;
            name: string;
            roleId: string;
            role: string;
            permissions: never[];
        };
        id: string;
        userId: string;
        startTime: Date;
        endTime: Date;
        createdAt: Date;
    }>;
    deleteBooking(actor: Actor, bookingId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        startTime: Date;
        endTime: Date;
    }>;
    getBookingsGroupedByUser(): Promise<{
        user: {
            id: string;
            name: string;
            roleId: string;
            role: string;
            permissions: string[];
        };
        bookings: Array<ReturnType<BookingsService["transformBooking"]>>;
    }[]>;
    getUsageSummary(): Promise<{
        user: {
            id: string;
            name: string;
            roleId: string;
            role: string;
            permissions: never[];
        } | null;
        totalBookings: number;
    }[]>;
}
