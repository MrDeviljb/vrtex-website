import { prisma } from "./prisma";

export async function logAdminAction(
  adminId: string,
  action: string,
  target: string,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        target,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
