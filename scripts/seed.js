const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database for production-ready initial state...");

  await prisma.auditLog.deleteMany();
  await prisma.ticketReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.result.deleteMany();
  await prisma.room.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating Main Super Admin (devil8900@admin.bgmi)...");
  const adminPasswordHash = await bcrypt.hash("DevilxAdmin", 10);

  const mainAdmin = await prisma.user.create({
    data: {
      email: "devil8900@admin.bgmi",
      username: "devil8900@admin.bgmi",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      mustChangePassword: true,
      profile: {
        create: {
          bio: "Main Esports Tournament Administrator",
          isVerified: true,
        },
      },
    },
  });

  console.log("Clean database initialized successfully!");
  console.log("==================================================");
  console.log("INITIAL BOOTSTRAP SUPER ADMIN:");
  console.log(`Username: devil8900@admin.bgmi`);
  console.log(`Password: DevilxAdmin`);
  console.log(`User ID:  ${mainAdmin.id}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
