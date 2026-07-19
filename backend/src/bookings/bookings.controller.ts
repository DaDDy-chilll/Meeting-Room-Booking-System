import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Permissions } from '../common/decorators/roles.decorator';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { PermissionsGuard } from '../common/guards/roles.guard';
import type { Actor } from '../common/interfaces/actor.interface';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

@UseGuards(AuthenticatedGuard, PermissionsGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Permissions('booking:view')
  listBookings() {
    return this.bookingsService.listBookings();
  }

  @Post()
  @Permissions('booking:create')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createBooking(
    @CurrentActor() actor: Actor,
    @Body() payload: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(actor, payload);
  }

  @Delete(':id')
  @Permissions('booking:delete:own')
  deleteBooking(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.bookingsService.deleteBooking(actor, id);
  }

  @Get('grouped/by-user')
  @Permissions('booking:view:grouped')
  groupedBookingsByUser() {
    return this.bookingsService.getBookingsGroupedByUser();
  }

  @Get('summary/usage')
  @Permissions('booking:view:summary')
  usageSummary() {
    return this.bookingsService.getUsageSummary();
  }
}
