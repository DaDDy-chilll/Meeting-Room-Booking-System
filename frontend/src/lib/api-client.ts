import type {
  Actor,
  ApiErrorPayload,
  AppUser,
  Booking,
  GroupedBookingsItem,
  RoleDefinition,
  UsageSummaryItem,
} from './types';
import { logger } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly payload: ApiErrorPayload | null,
    message: string,
  ) {
    super(message);
  }
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  actor?: Actor;
};

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    return payload;
  } catch (error) {
    logger.warn('Unable to parse API error payload', error);
    return null;
  }
}

function normalizeErrorMessage(payload: ApiErrorPayload | null): string {
  if (!payload) {
    return 'Unexpected API error.';
  }
  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }
  return payload.message;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (options.actor) {
    headers.set('x-user-id', options.actor.id);
    headers.set('x-user-role', options.actor.role);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    throw new ApiError(response.status, payload, normalizeErrorMessage(payload));
  }

  return (await response.json()) as T;
}

export const apiClient = {
  getActors: () => request<Actor[]>('/auth/actors'),
  getBookings: (actor: Actor) => request<Booking[]>('/bookings', { actor }),
  createBooking: (actor: Actor, startTime: string, endTime: string) =>
    request<Booking>('/bookings', {
      actor,
      method: 'POST',
      body: { startTime, endTime },
    }),
  deleteBooking: (actor: Actor, bookingId: string) =>
    request<Booking>(`/bookings/${bookingId}`, { actor, method: 'DELETE' }),
  getUsers: (actor: Actor) => request<AppUser[]>('/users', { actor }),
  createUser: (actor: Actor, name: string, roleId: string) =>
    request<AppUser>('/users', {
      actor,
      method: 'POST',
      body: { name, roleId },
    }),
  updateUserRole: (actor: Actor, id: string, roleId: string) =>
    request<AppUser>(`/users/${id}/role`, {
      actor,
      method: 'PATCH',
      body: { roleId },
    }),
  deleteUser: (actor: Actor, id: string) =>
    request<AppUser>(`/users/${id}`, { actor, method: 'DELETE' }),
  getRoles: (actor: Actor) => request<RoleDefinition[]>('/roles', { actor }),
  getAvailablePermissions: (actor: Actor) =>
    request<string[]>('/roles/permissions/available', { actor }),
  createRole: (actor: Actor, name: string, permissions: string[]) =>
    request<RoleDefinition>('/roles', {
      actor,
      method: 'POST',
      body: { name, permissions },
    }),
  updateRolePermissions: (actor: Actor, roleId: string, permissions: string[]) =>
    request<RoleDefinition>(`/roles/${roleId}/permissions`, {
      actor,
      method: 'PATCH',
      body: { permissions },
    }),
  deleteRole: (actor: Actor, roleId: string) =>
    request<RoleDefinition>(`/roles/${roleId}`, {
      actor,
      method: 'DELETE',
    }),
  getUsageSummary: (actor: Actor) =>
    request<UsageSummaryItem[]>('/bookings/summary/usage', { actor }),
  getGroupedBookings: (actor: Actor) =>
    request<GroupedBookingsItem[]>('/bookings/grouped/by-user', { actor }),
};
