import type { Actor } from '../common/interfaces/actor.interface';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
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
    deleteBooking(actor: Actor, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        startTime: Date;
        endTime: Date;
    }>;
    groupedBookingsByUser(): Promise<{
        user: {
            id: string;
            name: string;
            roleId: string;
            role: string;
            permissions: string[];
        };
        bookings: Array<ReturnType<BookingsService["transformBooking"]>>;
    }[]>;
    usageSummary(): Promise<{
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
