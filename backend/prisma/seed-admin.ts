import { prisma } from '../src/lib/db';
import { auth } from '../src/lib/auth';

/**
 * Seed admin users for testing the admin dashboard
 * 
 * This script creates admin users with different roles:
 * - Super Admin (full access)
 * - Moderator (content moderation)
 * - Finance Admin (monetization)
 * - Support Admin (user management)
 * - Compliance Officer (legal/compliance)
 */

async function seedAdminUsers() {
  console.log('🌱 Seeding admin users...');

  try {
    // Create admin users with Better Auth compatible structure
    const admins = [
      {
        id: 'admin-super-001',
        name: 'Super Admin',
        email: 'admin@streamit.com',
        username: 'superadmin',
        role: 'SUPER_ADMIN',
        password: 'Admin@12345', // Will be hashed by Better Auth
        bio: 'Platform Super Administrator',
      },
      {
        id: 'admin-mod-001',
        name: 'Content Moderator',
        email: 'moderator@streamit.com',
        username: 'moderator',
        role: 'MODERATOR',
        password: 'Moderator@123',
        bio: 'Content Moderation Team',
      },
      {
        id: 'admin-finance-001',
        name: 'Finance Admin',
        email: 'finance@streamit.com',
        username: 'financeadmin',
        role: 'FINANCE_ADMIN',
        password: 'Finance@12345',
        bio: 'Financial Operations Manager',
      },
      {
        id: 'admin-support-001',
        name: 'Support Admin',
        email: 'support@streamit.com',
        username: 'supportadmin',
        role: 'ADMIN',
        password: 'Support@12345',
        bio: 'User Support Team',
      },
      {
        id: 'admin-compliance-001',
        name: 'Compliance Officer',
        email: 'compliance@streamit.com',
        username: 'compliance',
        role: 'COMPLIANCE_OFFICER',
        password: 'Compliance@123',
        bio: 'Legal & Compliance Officer',
      },
    ];

    console.log('Creating admin users...');
    
    for (const admin of admins) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: admin.email },
      });

      if (existingUser) {
        console.log(`⚠️  User ${admin.email} already exists, skipping...`);
        continue;
      }

      // Use Better Auth's signUp API to create user with properly hashed password
      const signUpResult = await auth.api.signUpEmail({
        body: {
          name: admin.name,
          email: admin.email,
          password: admin.password,
          username: admin.username,
        },
      });

      if (!signUpResult?.user) {
        console.log(`⚠️  Failed to create user ${admin.email}`);
        continue;
      }

      // Update user with admin role and additional fields
      await prisma.user.update({
        where: { id: signUpResult.user.id },
        data: {
          role: admin.role as any,
          bio: admin.bio,
          emailVerified: true,
          lastLoginAt: new Date(),
        },
      });

      console.log(`✅ Created ${admin.role}: ${admin.email} (password: ${admin.password})`);
    }

    console.log('');
    console.log('📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔐 SUPER ADMIN (Full Access)');
    console.log('   Email:    admin@streamit.com');
    console.log('   Password: Admin@12345');
    console.log('');
    console.log('👮 MODERATOR (Content Moderation)');
    console.log('   Email:    moderator@streamit.com');
    console.log('   Password: Moderator@123');
    console.log('');
    console.log('💰 FINANCE ADMIN (Monetization)');
    console.log('   Email:    finance@streamit.com');
    console.log('   Password: Finance@12345');
    console.log('');
    console.log('🎧 SUPPORT ADMIN (User Management)');
    console.log('   Email:    support@streamit.com');
    console.log('   Password: Support@12345');
    console.log('');
    console.log('⚖️  COMPLIANCE OFFICER (Legal & Compliance)');
    console.log('   Email:    compliance@streamit.com');
    console.log('   Password: Compliance@123');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Create some test users for the dashboard to display
    console.log('Creating test users...');
    const testUsers = [
      {
        id: 'user-test-001',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        role: 'USER',
        bio: 'Regular user account',
      },
      {
        id: 'user-test-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        role: 'USER',
        bio: 'Another regular user',
      },
      {
        id: 'creator-test-001',
        name: 'Mike Creator',
        email: 'mike@example.com',
        username: 'mikecreator',
        role: 'CREATOR',
        bio: 'Content creator',
      },
    ];

    for (const testUser of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            ...testUser,
            emailVerified: true,
            lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`✅ Created test user: ${testUser.email}`);
      }
    }

    // Create coin wallets for test users
    console.log('Creating coin wallets...');
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['USER', 'CREATOR'] },
      },
    });

    for (const user of users) {
      const existingWallet = await prisma.coinWallet.findUnique({
        where: { userId: user.id },
      });

      if (!existingWallet) {
        await prisma.coinWallet.create({
          data: {
            userId: user.id,
            balance: Math.floor(Math.random() * 1000),
            totalEarned: user.role === 'CREATOR' ? Math.floor(Math.random() * 5000) : 0,
            totalSpent: Math.floor(Math.random() * 500),
          },
        });
      }
    }
    console.log(`✅ Created coin wallets for ${users.length} users`);

    // Create some test posts for moderation
    console.log('Creating test posts...');
    const creator = await prisma.user.findFirst({
      where: { role: 'CREATOR' },
    });

    if (creator) {
      const posts = [
        {
          content: 'Check out my latest stream! 🎮',
          type: 'TEXT',
          isPublic: true,
        },
        {
          content: 'Amazing gaming session today!',
          type: 'TEXT',
          isPublic: true,
          isFlagged: true,
          flagCount: 2,
        },
      ];

      for (const post of posts) {
        await prisma.post.create({
          data: {
            ...post,
            authorId: creator.id,
            type: post.type as any,
          },
        });
      }
      console.log(`✅ Created ${posts.length} test posts`);
    }

    // Create some test reports
    console.log('Creating test reports...');
    const regularUser = await prisma.user.findFirst({
      where: { role: 'USER' },
    });
    const reportedUser = await prisma.user.findFirst({
      where: { role: 'USER', id: { not: regularUser?.id } },
    });

    if (regularUser && reportedUser) {
      await prisma.report.create({
        data: {
          reason: 'SPAM',
          description: 'This user is posting spam content',
          reporterId: regularUser.id,
          reportedUserId: reportedUser.id,
          status: 'PENDING',
        },
      });
      console.log('✅ Created test report');
    }

    console.log('');
    console.log('✨ Admin users and test data seeded successfully!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Start the backend: cd backend && bun run dev');
    console.log('   2. Start the admin frontend: cd admin-fe && bun run dev');
    console.log('   3. Visit http://localhost:5174');
    console.log('   4. Login with any of the admin credentials above');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
    throw error;
  }
}

// Run the seed
seedAdminUsers()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
