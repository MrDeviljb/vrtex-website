import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "vortex_super_secret_jwt_key_2026_bgmi_esports_production";

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("vortex_auth_token")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        captainTeams: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        teamMemberships: {
          include: {
            team: {
              include: {
                captain: {
                  include: {
                    profile: true,
                  },
                },
                members: {
                  include: {
                    user: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.isBanned) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      profile: user.profile,
      captainTeams: user.captainTeams,
      teamMemberships: user.teamMemberships,
      createdAt: user.createdAt,
    };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export function parsePermissions(permissionsJson: string | null): string[] {
  if (!permissionsJson) return [];
  try {
    const parsed = JSON.parse(permissionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasPermission(user: { role: string; permissions?: string | null } | null, requiredPermission: string): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true; // Super admin has all permissions
  if (user.role === "MODERATOR" || user.role === "TOURNAMENT_ADMIN") {
    // Check restricted operations that MODERATORS are explicitly forbidden from doing
    const FORBIDDEN_MODERATOR_PERMISSIONS = [
      "CREATE_MODERATOR",
      "DELETE_MODERATOR",
      "CREATE_ADMIN",
      "PROMOTE_SELF",
      "MODIFY_ROLE",
      "MODIFY_SUPER_ADMIN",
      "ACCESS_SECURITY_SETTINGS",
      "GRANT_PERMISSIONS"
    ];
    if (FORBIDDEN_MODERATOR_PERMISSIONS.includes(requiredPermission)) {
      return false;
    }
    const granted = parsePermissions(user.permissions || null);
    return granted.includes(requiredPermission) || granted.includes("ALL");
  }
  return false;
}

export function hasAdminPermission(role: string, required: "ANY_ADMIN" | "TOURNAMENT" | "MODERATOR" | "FINANCE" | "SUPER"): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (required === "ANY_ADMIN") {
    return ["SUPER_ADMIN", "TOURNAMENT_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(role);
  }
  if (required === "TOURNAMENT") {
    return ["SUPER_ADMIN", "TOURNAMENT_ADMIN"].includes(role);
  }
  if (required === "MODERATOR") {
    return ["SUPER_ADMIN", "TOURNAMENT_ADMIN", "MODERATOR"].includes(role);
  }
  if (required === "FINANCE") {
    return ["SUPER_ADMIN", "FINANCE_ADMIN"].includes(role);
  }
  if (required === "SUPER") {
    return role === "SUPER_ADMIN";
  }
  return false;
}
