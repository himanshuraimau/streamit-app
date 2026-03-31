#!/usr/bin/env bun
/**
 * Create admin user via Better Auth API
 * This ensures the password is hashed correctly by Better Auth
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

async function createAdminViaAPI(
  email: string,
  password: string,
  name: string,
  role: UserRole = UserRole.ADMIN
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`ℹ️  User already exists: ${email}`);
      console.log(`   Promoting to ${role}...`);
      
      const updated = await prisma.user.update({
        where: { email },
        data: { role },
      });
      
      console.log(`✅ User promoted to ${role}`);
      console.log(`\nLogin Credentials:`);
      console.log(`  Email: ${updated.email}`);
      console.log(`  Password: (use your existing password)`);
      console.log(`  Role: ${updated.role}`);
      return;
    }

    // Generate unique username
    const username = email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 7);

    // Create user via Better Auth signup API
    console.log(`Creating user via Better Auth API...`);
    const response = await fetch(`${API_URL}/api/auth/signup/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name,
        username,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Failed to create user via API (${response.status}):`, text);
      process.exit(1);
    }

    const data = await response.json();

    console.log(`✅ User created successfully via Better Auth`);

    // Now promote to admin
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found after creation`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role,
        emailVerified: true, // Auto-verify for admin
      },
    });

    console.log(`✅ User promoted to ${role} and email verified`);
    console.log(`\nUser Details:`);
    console.log(`  ID: ${updated.id}`);
    console.log(`  Name: ${updated.name}`);
    console.log(`  Email: ${updated.email}`);
    console.log(`  Username: ${updated.username}`);
    console.log(`  Role: ${updated.role}`);
    console.log(`\nLogin Credentials:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`\nThe user can now access the admin dashboard at:`);
    console.log(`  http://localhost:5174 (development)`);
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(`Usage: bun scripts/create-admin-via-api.ts <email> <password> [name] [role]`);
  console.error(`\nExamples:`);
  console.error(`  bun scripts/create-admin-via-api.ts admin@test.com password123`);
  console.error(`  bun scripts/create-admin-via-api.ts admin@test.com password123 "Admin User" SUPER_ADMIN`);
  process.exit(1);
}

const email = args[0];
const password = args[1];
const name = args[2] || "Admin User";
const role = args[3] ? (args[3].toUpperCase() as UserRole) : UserRole.ADMIN;

createAdminViaAPI(email, password, name, role);
