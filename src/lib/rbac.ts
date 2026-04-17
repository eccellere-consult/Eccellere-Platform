/**
 * Role-Based Access Control (RBAC) for Eccellere platform.
 *
 * Defines permissions per role and provides middleware helpers
 * for protecting API routes and server components.
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// Mirror the Prisma UserRole enum
export type UserRole =
  | "CLIENT"
  | "SPECIALIST"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "CONTENT_ADMIN"
  | "MARKETPLACE_ADMIN"
  | "CRM_ADMIN"
  | "FINANCE_ADMIN";

export type Permission =
  // Admin panel
  | "admin:access"
  | "admin:users:read"
  | "admin:users:write"
  | "admin:orders:read"
  | "admin:orders:write"
  | "admin:finance:read"
  | "admin:finance:write"
  | "admin:assets:read"
  | "admin:assets:write"
  | "admin:assets:approve"
  | "admin:content:read"
  | "admin:content:write"
  | "admin:specialists:read"
  | "admin:specialists:write"
  | "admin:coupons:read"
  | "admin:coupons:write"
  | "admin:audit:read"
  | "admin:chatbot:read"
  | "admin:settings:read"
  | "admin:settings:write"
  // Client actions
  | "client:dashboard"
  | "client:orders:read"
  | "client:assets:read"
  | "client:profile:write"
  | "client:assessment:take"
  // Specialist actions
  | "specialist:dashboard"
  | "specialist:assets:submit"
  | "specialist:assignments:read"
  | "specialist:earnings:read"
  | "specialist:profile:write";

/**
 * Permission matrix — maps each role to its allowed permissions.
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "admin:access",
    "admin:users:read", "admin:users:write",
    "admin:orders:read", "admin:orders:write",
    "admin:finance:read", "admin:finance:write",
    "admin:assets:read", "admin:assets:write", "admin:assets:approve",
    "admin:content:read", "admin:content:write",
    "admin:specialists:read", "admin:specialists:write",
    "admin:coupons:read", "admin:coupons:write",
    "admin:audit:read",
    "admin:chatbot:read",
    "admin:settings:read", "admin:settings:write",
  ],
  ADMIN: [
    "admin:access",
    "admin:users:read", "admin:users:write",
    "admin:orders:read", "admin:orders:write",
    "admin:finance:read",
    "admin:assets:read", "admin:assets:write", "admin:assets:approve",
    "admin:content:read", "admin:content:write",
    "admin:specialists:read", "admin:specialists:write",
    "admin:coupons:read", "admin:coupons:write",
    "admin:audit:read",
    "admin:chatbot:read",
    "admin:settings:read",
  ],
  CONTENT_ADMIN: [
    "admin:access",
    "admin:content:read", "admin:content:write",
    "admin:assets:read",
    "admin:chatbot:read",
  ],
  MARKETPLACE_ADMIN: [
    "admin:access",
    "admin:assets:read", "admin:assets:write", "admin:assets:approve",
    "admin:orders:read",
    "admin:coupons:read", "admin:coupons:write",
  ],
  CRM_ADMIN: [
    "admin:access",
    "admin:users:read", "admin:users:write",
    "admin:specialists:read", "admin:specialists:write",
    "admin:orders:read",
  ],
  FINANCE_ADMIN: [
    "admin:access",
    "admin:finance:read", "admin:finance:write",
    "admin:orders:read", "admin:orders:write",
  ],
  CLIENT: [
    "client:dashboard",
    "client:orders:read",
    "client:assets:read",
    "client:profile:write",
    "client:assessment:take",
  ],
  SPECIALIST: [
    "specialist:dashboard",
    "specialist:assets:submit",
    "specialist:assignments:read",
    "specialist:earnings:read",
    "specialist:profile:write",
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get the list of admin roles (roles that can access /admin).
 */
export function isAdminRole(role: UserRole): boolean {
  return hasPermission(role, "admin:access");
}

interface SessionUser {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/**
 * API route middleware: require authentication.
 * Returns a 401 response if not authenticated, or null + user if OK.
 */
export async function requireAuth(): Promise<
  { error: NextResponse; user?: never } | { error?: never; user: SessionUser }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * API route middleware: require specific permission(s).
 * Returns a 401/403 response if not authorised, or null + user if OK.
 */
export async function requirePermission(
  ...permissions: Permission[]
): Promise<
  { error: NextResponse; user?: never } | { error?: never; user: SessionUser }
> {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const { user } = auth;
  const role = user.role as UserRole;

  if (!hasAnyPermission(role, permissions)) {
    return {
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * API route middleware: require admin-level access.
 */
export async function requireAdmin(): Promise<
  { error: NextResponse; user?: never } | { error?: never; user: SessionUser }
> {
  return requirePermission("admin:access");
}
