import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "INFO" | "SUCCESS" | "WARNING" | "ROOM" | "PRIZE" = "INFO"
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}
