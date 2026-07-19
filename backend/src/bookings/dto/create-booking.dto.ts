import { IsISO8601 } from 'class-validator';

export class CreateBookingDto {
  @IsISO8601({ strict: true })
  startTime!: string;

  @IsISO8601({ strict: true })
  endTime!: string;
}
