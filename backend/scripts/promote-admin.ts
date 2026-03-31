#!/usr/bin/env bun
/**
 * Admin Promotion Script
 * 
 * Promotes an existing user to ADMIN or SUPER_ADMIN role, or creates a new test admin user.
 * 
 * Usage:
 *   # Promote existing user
 *   bun scripts/promote-admin.ts <email> [role]
 * 
 *   # Create new test admin user
 *   bun scripts/promote-admin.ts --create <email> <password> [role]
 * 
 * Arguments:
 *   email    - User's email address
 *   password - Password for new user (only with --create)
 *   role     - Role to assign (ADMIN or SUPER_ADMIN, defaults to ADMIN)
 * 
 * Examples:
 *   # Promote existing user
 *   bun scripts/promote-admin.ts user@example.com
 *   bun scripts/promote-admin.ts user@example.com SUPER_ADMIN
 * 
 *   # Create new test admin
 *   bun scripts/promote-admin.ts --create admin@test.com password123
 *   bun scripts/promote-admin.ts --create admin@test.com password123 SUPER_ADMIN
 */

import { PrismaClient, UserRole } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function hashPasswordBetterAuth(password: string): Promise<string> {
  // Better Auth uses scrypt with salt:key format
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function generateUserId(): Promise<string> {
  // Generate a unique user ID (similar to Better Auth format)
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

async function createTestAdmin(
  email: string,
  password: string,
  role: UserRole = UserRole.ADMIN
) {
  try {
    // Validate role
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      console.error(`❌ Invalid role: ${role}`);
      console.error(`   Valid roles: ADMIN, SUPER_ADMIN`);
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`❌ User already exists with email: ${email}`);
      console.error(`   Use without --create flag to promote existing user`);
      process.exit(1);
    }

    // Generate username from email
    const username = email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 7);

    // Hash password using Better Auth format (salt:key)
    const hashedPassword = await hashPasswordBetterAuth(password);

    // Generate user ID
    const userId = await generateUserId();

    // Create user with admin role
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        username,
        name: "Test Admin",
        emailVerified: true, // Auto-verify for test admin
        role,
      },
    });

    // Create account with password
    await prisma.account.create({
      data: {
        id: `account_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        accountId: userId,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    console.log(`✅ Successfully created test admin user with ${role} role`);
    console.log(`\nUser Details:`);
    console.log(`  ID:       ${user.id}`);
    console.log(`  Name:     ${user.name}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role:     ${user.role}`);
    console.log(`  Password: ${password}`);
    console.log(`\nLogin Credentials:`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${password}`);
    console.log(`\nThe user can now access the admin dashboard at:`);
    console.log(`  http://localhost:5174 (development)`);
  } catch (error) {
    console.error(`❌ Error creating test admin:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function promoteToAdmin(email: string, role: UserRole = UserRole.ADMIN) {
  try {
    // Validate role
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      console.error(`❌ Invalid role: ${role}`);
      console.error(`   Valid roles: ADMIN, SUPER_ADMIN`);
      process.exit(1);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.error(`\nTo create a new test admin user, use:`);
      console.error(`   bun scripts/promote-admin.ts --create ${email} <password>`);
      process.exit(1);
    }

    // Check if user already has the role
    if (user.role === role) {
      console.log(`ℹ️  User ${user.email} already has role: ${role}`);
      console.log(`   No changes made.`);
      process.exit(0);
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    console.log(`✅ Successfully promoted user to ${role}`);
    console.log(`\nUser Details:`);
    console.log(`  ID:       ${updatedUser.id}`);
    console.log(`  Name:     ${updatedUser.name}`);
    console.log(`  Email:    ${updatedUser.email}`);
    console.log(`  Username: ${updatedUser.username}`);
    console.log(`  Role:     ${updatedUser.role}`);
    console.log(`\nThe user can now access the admin dashboard at:`);
    console.log(`  http://localhost:5174 (development)`);
  } catch (error) {
    console.error(`❌ Error promoting user:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(`Usage:`);
  console.error(`  # Promote existing user`);
  console.error(`  bun scripts/promote-admin.ts <email> [role]`);
  console.error(``);
  console.error(`  # Create new test admin user`);
  console.error(`  bun scripts/promote-admin.ts --create <email> <password> [role]`);
  console.error(`\nArguments:`);
  console.error(`  email    - User's email address (required)`);
  console.error(`  password - Password for new user (only with --create)`);
  console.error(`  role     - Role to assign: ADMIN or SUPER_ADMIN (optional, defaults to ADMIN)`);
  console.error(`\nExamples:`);
  console.error(`  bun scripts/promote-admin.ts user@example.com`);
  console.error(`  bun scripts/promote-admin.ts user@example.com SUPER_ADMIN`);
  console.error(`  bun scripts/promote-admin.ts --create admin@test.com password123`);
  console.error(`  bun scripts/promote-admin.ts --create admin@test.com password123 SUPER_ADMIN`);
  process.exit(1);
}

// Check if --create flag is present
if (args[0] === "--create") {
  if (args.length < 3) {
    console.error(`❌ Missing arguments for --create`);
    console.error(`   Usage: bun scripts/promote-admin.ts --create <email> <password> [role]`);
    process.exit(1);
  }

  const email = args[1];
  const password = args[2];
  const role = args[3] ? (args[3].toUpperCase() as UserRole) : UserRole.ADMIN;

  createTestAdmin(email, password, role);
} else {
  // Promote existing user
  const email = args[0];
  const role = args[1] ? (args[1].toUpperCase() as UserRole) : UserRole.ADMIN;

  promoteToAdmin(email, role);
}
