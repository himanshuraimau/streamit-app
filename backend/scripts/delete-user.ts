#!/usr/bin/env bun
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`ℹ️  User not found: ${email}`);
      process.exit(0);
    }

    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Successfully deleted user: ${email}`);
  } catch (error) {
    console.error(`❌ Error deleting user:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun scripts/delete-user.ts <email>");
  process.exit(1);
}

deleteUser(email);
