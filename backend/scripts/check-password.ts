#!/usr/bin/env bun
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPassword(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Role: ${user.role}`);
    console.log(`\nAccounts:`);
    
    for (const account of user.accounts) {
      console.log(`\nAccount ID: ${account.id}`);
      console.log(`Provider: ${account.providerId}`);
      console.log(`Password hash: ${account.password?.substring(0, 50)}...`);
      console.log(`Password hash length: ${account.password?.length}`);
      console.log(`Password format: ${account.password?.includes(':') ? 'salt:key format' : 'other format'}`);
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun scripts/check-password.ts <email>");
  process.exit(1);
}

checkPassword(email);
