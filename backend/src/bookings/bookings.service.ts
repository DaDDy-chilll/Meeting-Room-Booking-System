import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Actor } from '../common/interfaces/actor.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  listBookings() {
    return this.prisma.booking
      .findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              roleId: true,
              role: { select: { name: true } },
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
      })
      .then((bookings) =>
        bookings.map((booking) => ({
          ...booking,
          user: {
            id: booking.user.id,
            name: booking.user.name,
            roleId: booking.user.roleId,
            role: booking.user.role.name,
            permissions: [],
          },
        })),
      );
  }

  private transformBooking(booking: {
    id: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    user: { id: string; name: string; roleId: string; role: { name: string } };
  }) {
    return {
      ...booking,
      user: {
        id: booking.user.id,
        name: booking.user.name,
        roleId: booking.user.roleId,
        role: booking.user.role.name,
        permissions: [],
      },
    };
  }

  private async loadBookingWithUser(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ) {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roleId: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    return this.transformBooking(booking);
  }

  async createBooking(actor: Actor, payload: CreateBookingDto) {
    const startTime = new Date(payload.startTime);
    const endTime = new Date(payload.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException(
        'Invalid datetime format. Use ISO 8601 UTC.',
      );
    }

    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime.');
    }

    this.logger.log(
      `Creating booking requested by actor=${actor.id} from=${startTime.toISOString()} to=${endTime.toISOString()}`,
    );

    return this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: actor.id },
          select: { id: true },
        });

        if (!user) {
          throw new NotFoundException('Actor user no longer exists.');
        }

        const overlap = await tx.booking.findFirst({
          where: {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true, startTime: true, endTime: true },
        });

        if (overlap) {
          this.logger.warn(
            `Booking overlap conflict actor=${actor.id} conflictBooking=${overlap.id}`,
          );
          throw new ConflictException('Booking overlap detected.');
        }

        const created = await tx.booking.create({
          data: {
            userId: actor.id,
            startTime,
            endTime,
          },
        });

        return this.loadBookingWithUser(tx, created.id);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async deleteBooking(actor: Actor, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, userId: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    const canDeleteAny = actor.permissions.includes('booking:delete:any');
    if (!canDeleteAny && booking.userId !== actor.id) {
      throw new ForbiddenException('Users can only delete their own bookings.');
    }

    this.logger.log(`Deleting booking=${bookingId} by actor=${actor.id}`);
    return this.prisma.booking.delete({ where: { id: bookingId } });
  }

  async getBookingsGroupedByUser() {
    const bookings = await this.prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roleId: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: [{ userId: 'asc' }, { startTime: 'asc' }],
    });

    const grouped = new Map<
      string,
      {
        user: {
          id: string;
          name: string;
          roleId: string;
          role: string;
          permissions: string[];
        };
        bookings: Array<ReturnType<BookingsService['transformBooking']>>;
      }
    >();

    for (const rawBooking of bookings) {
      const booking = this.transformBooking(rawBooking);
      const current = grouped.get(booking.userId);
      if (current) {
        current.bookings.push(booking);
        continue;
      }

      grouped.set(booking.userId, {
        user: booking.user,
        bookings: [booking],
      });
    }

    return Array.from(grouped.values());
  }

  async getUsageSummary() {
    const grouped = await this.prisma.booking.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((item) => item.userId) } },
      select: {
        id: true,
        name: true,
        roleId: true,
        role: { select: { name: true } },
      },
    });

    const userMap = new Map(
      users.map((user) => [
        user.id,
        {
          id: user.id,
          name: user.name,
          roleId: user.roleId,
          role: user.role.name,
          permissions: [],
        },
      ]),
    );
    return grouped.map((item) => ({
      user: userMap.get(item.userId) ?? null,
      totalBookings: item._count.id,
    }));
  }
}
