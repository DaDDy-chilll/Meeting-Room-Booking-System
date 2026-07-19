"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import type {
  Actor,
  AppUser,
  Booking,
  GroupedBookingsItem,
  RoleDefinition,
  UsageSummaryItem,
} from "@/lib/types";

type Notice = {
  kind: "success" | "error";
  text: string;
};

type DeleteConfirmation = {
  kind: "booking" | "user" | "role";
  id: string;
  title: string;
  message: string;
  warningText: string;
  confirmLabel: string;
};

function hasPermission(actor: Actor | null, permission: string): boolean {
  return !!actor && actor.permissions.includes(permission);
}

function toIsoFromLocalDateTime(value: string): string {
  return new Date(value).toISOString();
}

function formatUtc(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function roleBadgeClass(role: string): string {
  const normalized = role.toLowerCase();
  if (normalized.includes("admin")) {
    return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
  }
  if (normalized.includes("owner")) {
    return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
  }
  if (normalized.includes("user")) {
    return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  }
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

function LoadingCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-1/2 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </section>
  );
}

function EmptyBookingsState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <svg
        className="h-10 w-10 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 2v3m8-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        />
      </svg>
      <p className="text-sm font-medium text-slate-700">
        No bookings found for this user.
      </p>
      <p className="text-xs text-slate-500">
        Create a booking to get started with the meeting room schedule.
      </p>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25";

export default function Home() {
  const pathname = usePathname();
  const [actors, setActors] = useState<Actor[]>([]);
  const [activeActorId, setActiveActorId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [summary, setSummary] = useState<UsageSummaryItem[]>([]);
  const [grouped, setGrouped] = useState<GroupedBookingsItem[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [rolePermissionUpdates, setRolePermissionUpdates] = useState<
    Record<string, string[]>
  >({});
  const [editingRoleIds, setEditingRoleIds] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  const activeActor = useMemo(
    () => actors.find((item) => item.id === activeActorId) ?? null,
    [actors, activeActorId],
  );

  const handleError = useCallback((error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiError) {
      logger.error("api_error", { statusCode: error.statusCode, payload: error.payload });
      if (error.statusCode === 429) {
        setNotice({
          kind: "error",
          text: "Rate limit reached. Please wait before trying again.",
        });
        return;
      }
      setNotice({ kind: "error", text: error.message });
      return;
    }
    logger.error("unexpected_error", error);
    setNotice({ kind: "error", text: fallbackMessage });
  }, []);

  const loadActors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getActors();
      setActors(response);
      if (response.length > 0) {
        setActiveActorId((current) => current || response[0].id);
      }
    } catch (error) {
      handleError(error, "Failed to load actor list.");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadDashboardData = useCallback(
    async (actor: Actor) => {
      setLoading(true);
      try {
        const canViewUsers = hasPermission(actor, "user:view");
        const canViewRoles = hasPermission(actor, "role:view");
        const canViewSummary = hasPermission(actor, "booking:view:summary");
        const canViewGrouped = hasPermission(actor, "booking:view:grouped");

        const [
          bookingResponse,
          userResponse,
          roleResponse,
          permissionResponse,
          summaryResponse,
          groupedResponse,
        ] = await Promise.all([
          hasPermission(actor, "booking:view")
            ? apiClient.getBookings(actor)
            : Promise.resolve([]),
          canViewUsers ? apiClient.getUsers(actor) : Promise.resolve([]),
          canViewRoles ? apiClient.getRoles(actor) : Promise.resolve([]),
          canViewRoles
            ? apiClient.getAvailablePermissions(actor)
            : Promise.resolve([]),
          canViewSummary ? apiClient.getUsageSummary(actor) : Promise.resolve([]),
          canViewGrouped ? apiClient.getGroupedBookings(actor) : Promise.resolve([]),
        ]);

        setBookings(bookingResponse);
        setUsers(userResponse);
        setRoles(roleResponse);
        setAvailablePermissions(permissionResponse);
        setSummary(summaryResponse);
        setGrouped(groupedResponse);
        if (roleResponse.length > 0 && !newUserRoleId) {
          setNewUserRoleId(roleResponse[0].id);
        }
      } catch (error) {
        handleError(error, "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    },
    [handleError, newUserRoleId],
  );

  useEffect(() => {
    logger.info("route_transition", { pathname });
  }, [pathname]);

  useEffect(() => {
    logger.info("app_boot", { at: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadActors();
  }, [loadActors]);

  useEffect(() => {
    if (!activeActor) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardData(activeActor);
  }, [activeActor, loadDashboardData]);

  async function handleCreateBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeActor || !hasPermission(activeActor, "booking:create")) {
      setNotice({
        kind: "error",
        text: "You do not have booking create permission.",
      });
      return;
    }
    if (!startTime || !endTime) {
      setNotice({ kind: "error", text: "Both start and end times are required." });
      return;
    }

    try {
      await apiClient.createBooking(
        activeActor,
        toIsoFromLocalDateTime(startTime),
        toIsoFromLocalDateTime(endTime),
      );
      setNotice({ kind: "success", text: "Booking created." });
      setStartTime("");
      setEndTime("");
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to create booking.");
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    if (
      !activeActor ||
      (!hasPermission(activeActor, "booking:delete:own") &&
        !hasPermission(activeActor, "booking:delete:any"))
    ) {
      return;
    }
    try {
      await apiClient.deleteBooking(activeActor, bookingId);
      setNotice({ kind: "success", text: "Booking deleted." });
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to delete booking.");
    }
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeActor || !hasPermission(activeActor, "user:create")) {
      return;
    }
    if (!newUserRoleId) {
      setNotice({ kind: "error", text: "Select a role for the new user." });
      return;
    }

    try {
      await apiClient.createUser(activeActor, newUserName, newUserRoleId);
      setNotice({ kind: "success", text: "User created." });
      setNewUserName("");
      await loadActors();
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to create user.");
    }
  }

  async function handleRoleChange(userId: string, roleId: string) {
    if (!activeActor || !hasPermission(activeActor, "user:update-role")) {
      return;
    }

    try {
      await apiClient.updateUserRole(activeActor, userId, roleId);
      setNotice({ kind: "success", text: "User role updated." });
      await loadActors();
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to update user role.");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!activeActor || !hasPermission(activeActor, "user:delete")) {
      return;
    }

    try {
      await apiClient.deleteUser(activeActor, userId);
      setNotice({ kind: "success", text: "User deleted (bookings cascaded)." });
      await loadActors();
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to delete user.");
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (!activeActor || !hasPermission(activeActor, "role:delete")) {
      return;
    }

    try {
      await apiClient.deleteRole(activeActor, roleId);
      setNotice({ kind: "success", text: "Role deleted." });
      setRolePermissionUpdates((current) => {
        const next = { ...current };
        delete next[roleId];
        return next;
      });
      setEditingRoleIds((current) => {
        const next = { ...current };
        delete next[roleId];
        return next;
      });
      await loadActors();
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to delete role.");
    }
  }

  async function handleCreateRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeActor || !hasPermission(activeActor, "role:create")) {
      return;
    }
    if (newRolePermissions.length === 0) {
      setNotice({
        kind: "error",
        text: "Select at least one permission for the role.",
      });
      return;
    }

    try {
      await apiClient.createRole(activeActor, newRoleName, newRolePermissions);
      setNotice({ kind: "success", text: "Role created." });
      setNewRoleName("");
      setNewRolePermissions([]);
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to create role.");
    }
  }

  async function handleUpdateRolePermissions(roleId: string) {
    if (!activeActor || !hasPermission(activeActor, "role:update-permissions")) {
      return;
    }
    const permissions = rolePermissionUpdates[roleId] ?? [];
    if (permissions.length === 0) {
      setNotice({ kind: "error", text: "Select at least one permission." });
      return;
    }

    try {
      await apiClient.updateRolePermissions(activeActor, roleId, permissions);
      setNotice({ kind: "success", text: "Role permissions updated." });
      setEditingRoleIds((current) => ({ ...current, [roleId]: false }));
      await loadActors();
      await loadDashboardData(activeActor);
    } catch (error) {
      handleError(error, "Failed to update role permissions.");
    }
  }

  function beginRoleEdit(role: RoleDefinition) {
    setRolePermissionUpdates((current) => ({
      ...current,
      [role.id]: current[role.id] ?? role.permissions,
    }));
    setEditingRoleIds((current) => ({ ...current, [role.id]: true }));
  }

  function cancelRoleEdit(roleId: string) {
    setEditingRoleIds((current) => ({ ...current, [roleId]: false }));
    setRolePermissionUpdates((current) => {
      const next = { ...current };
      delete next[roleId];
      return next;
    });
  }

  async function confirmDeleteAction() {
    if (!deleteConfirmation) {
      return;
    }

    setConfirmingDelete(true);
    try {
      if (deleteConfirmation.kind === "booking") {
        await handleDeleteBooking(deleteConfirmation.id);
      }
      if (deleteConfirmation.kind === "user") {
        await handleDeleteUser(deleteConfirmation.id);
      }
      if (deleteConfirmation.kind === "role") {
        await handleDeleteRole(deleteConfirmation.id);
      }
      setDeleteConfirmation(null);
    } finally {
      setConfirmingDelete(false);
    }
  }

  function togglePermission(
    current: string[],
    targetPermission: string,
    setValue: (permissions: string[]) => void,
  ) {
    if (current.includes(targetPermission)) {
      setValue(current.filter((permission) => permission !== targetPermission));
      return;
    }
    setValue([...current, targetPermission]);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Meeting Room Booking Dashboard
              </h1>
              <p className="text-sm text-slate-600">
                Modern scheduling workspace with dynamic role-based access control.
              </p>
              {activeActor ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-slate-500">Signed in as</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {activeActor.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadgeClass(activeActor.role)}`}
                  >
                    {activeActor.role}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="actor"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Active User
              </label>
              <select
                id="actor"
                className={inputClassName}
                value={activeActorId}
                onChange={(event) => setActiveActorId(event.target.value)}
              >
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name} ({actor.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {notice ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
              notice.kind === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        {loading ? <LoadingCards /> : null}

        {hasPermission(activeActor, "booking:create") ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Create Booking</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a start and end time in your local timezone. Data is stored in UTC.
            </p>
            <form
              onSubmit={handleCreateBooking}
              className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={inputClassName}
                required
              />
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={inputClassName}
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:translate-y-px"
              >
                Create Booking
              </button>
            </form>
          </section>
        ) : null}

        {hasPermission(activeActor, "booking:view") ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Start (UTC)</th>
                    <th className="px-4 py-3 font-semibold">End (UTC)</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6" colSpan={5}>
                        <EmptyBookingsState />
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => {
                      const canDeleteAny = hasPermission(activeActor, "booking:delete:any");
                      const canDeleteOwn =
                        hasPermission(activeActor, "booking:delete:own") &&
                        activeActor?.id === booking.userId;
                      const canDelete = canDeleteAny || canDeleteOwn;

                      return (
                        <tr
                          key={booking.id}
                          className="border-t border-slate-200 text-slate-700 transition hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {booking.user.name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadgeClass(booking.user.role)}`}
                            >
                              {booking.user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatUtc(booking.startTime)}</td>
                          <td className="px-4 py-3">{formatUtc(booking.endTime)}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              disabled={!canDelete}
                              onClick={() =>
                                setDeleteConfirmation({
                                  kind: "booking",
                                  id: booking.id,
                                  title: "Delete Booking",
                                  message: `Delete booking for ${booking.user.name} from ${formatUtc(booking.startTime)} to ${formatUtc(booking.endTime)}?`,
                                  warningText: "This action is permanent and cannot be undone.",
                                  confirmLabel: "Delete Booking",
                                })
                              }
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {hasPermission(activeActor, "user:view") ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">User Management</h2>

            {hasPermission(activeActor, "user:create") ? (
              <form
                onSubmit={handleCreateUser}
                className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  type="text"
                  placeholder="Full name"
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                  className={inputClassName}
                  required
                />
                <select
                  value={newUserRoleId}
                  onChange={(event) => setNewUserRoleId(event.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                  Create User
                </button>
              </form>
            ) : null}

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Bookings</th>
                    <th className="px-4 py-3 font-semibold">Update Role</th>
                    <th className="px-4 py-3 font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-200 text-slate-700 transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadgeClass(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{user._count?.bookings ?? 0}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.roleId}
                          disabled={!hasPermission(activeActor, "user:update-role")}
                          onChange={(event) => void handleRoleChange(user.id, event.target.value)}
                          className={`${inputClassName} max-w-[220px] disabled:opacity-55`}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={!hasPermission(activeActor, "user:delete")}
                          onClick={() =>
                            setDeleteConfirmation({
                              kind: "user",
                              id: user.id,
                              title: "Delete User",
                              message: `Delete user ${user.name}?`,
                              warningText:
                                "All bookings created by this user will also be deleted.",
                              confirmLabel: "Delete User",
                            })
                          }
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {hasPermission(activeActor, "role:view") ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Role Management</h2>

            {hasPermission(activeActor, "role:create") ? (
              <form onSubmit={handleCreateRole} className="mt-5 space-y-4">
                <input
                  type="text"
                  placeholder="New role name"
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  className={inputClassName}
                  required
                />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={newRolePermissions.includes(permission)}
                        onChange={() =>
                          togglePermission(newRolePermissions, permission, setNewRolePermissions)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {permission}
                    </label>
                  ))}
                </div>
                <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                  Create Role
                </button>
              </form>
            ) : null}

            <div className="mt-6 space-y-4">
              {roles.map((role) => {
                const editablePermissions =
                  rolePermissionUpdates[role.id] ?? role.permissions;
                const isEditing = !!editingRoleIds[role.id];
                return (
                  <div
                    key={role.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold capitalize text-slate-900">
                        {role.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {hasPermission(activeActor, "role:update-permissions") ? (
                          <button
                            type="button"
                            onClick={() =>
                              isEditing ? cancelRoleEdit(role.id) : beginRoleEdit(role)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            {isEditing ? "Cancel" : "Edit"}
                          </button>
                        ) : null}
                        {hasPermission(activeActor, "role:delete") ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmation({
                                kind: "role",
                                id: role.id,
                                title: "Delete Role",
                                message: `Delete role ${role.name}?`,
                                warningText:
                                  "This can break user assignments. Move users to another role before deleting.",
                                confirmLabel: "Delete Role",
                              })
                            }
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isEditing ? (
                      <>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {availablePermissions.map((permission) => (
                            <label
                              key={`${role.id}-${permission}`}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={editablePermissions.includes(permission)}
                                disabled={!hasPermission(activeActor, "role:update-permissions")}
                                onChange={() =>
                                  setRolePermissionUpdates((current) => {
                                    const existing = current[role.id] ?? role.permissions;
                                    const next = existing.includes(permission)
                                      ? existing.filter((item) => item !== permission)
                                      : [...existing, permission];
                                    return { ...current, [role.id]: next };
                                  })
                                }
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              {permission}
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleUpdateRolePermissions(role.id)}
                          className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Save Permissions
                        </button>
                      </>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {role.permissions.map((permission) => (
                          <span
                            key={`${role.id}-${permission}`}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasPermission(activeActor, "booking:view:summary") ||
        hasPermission(activeActor, "booking:view:grouped") ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {hasPermission(activeActor, "booking:view:summary") ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Usage Summary
                  </h3>
                  <ul className="space-y-2">
                    {summary.map((item, index) => (
                      <li
                        key={`${item.user?.id ?? "unknown"}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <span className="font-medium text-slate-900">
                          {item.user?.name ?? "Unknown User"}
                        </span>{" "}
                        — {item.totalBookings} bookings
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {hasPermission(activeActor, "booking:view:grouped") ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Grouped by User
                  </h3>
                  <ul className="space-y-2">
                    {grouped.map((group) => (
                      <li
                        key={group.user.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <span className="font-medium text-slate-900">
                          {group.user.name}
                        </span>{" "}
                        ({group.user.role}) — {group.bookings.length} bookings
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {deleteConfirmation ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">
                {deleteConfirmation.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{deleteConfirmation.message}</p>
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Warning: {deleteConfirmation.warningText}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmingDelete}
                  onClick={() => void confirmDeleteAction()}
                  className="rounded-lg border border-rose-200 bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmingDelete ? "Deleting..." : deleteConfirmation.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
