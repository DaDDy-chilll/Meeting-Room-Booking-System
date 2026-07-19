export type Role = string;

export interface Actor {
  id: string;
  name: string;
  roleId: string;
  role: Role;
  permissions: string[];
}

export interface Booking {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  user: Actor;
}

export interface AppUser extends Actor {
  _count?: {
    bookings: number;
  };
}

export interface RoleDefinition {
  id: string;
  name: string;
  permissions: string[];
}

export interface UsageSummaryItem {
  user: Actor | null;
  totalBookings: number;
}

export interface GroupedBookingsItem {
  user: Actor;
  bookings: Booking[];
}

export interface ApiErrorPayload {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}
