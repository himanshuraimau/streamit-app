import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminRole() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@streamit.com' },
      select: { id: true, email: true, username: true, role: true },
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(JSON.stringify(admin, null, 2));

    // If role is not SUPER_ADMIN, update it
    if (admin.role !== 'SUPER_ADMIN') {
      console.log(`\n⚠️  Role is ${admin.role}, updating to SUPER_ADMIN...`);
      await prisma.user.update({
        where: { email: 'admin@streamit.com' },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log('✅ Role updated to SUPER_ADMIN');
    } else {
      console.log('\n✅ Role is already SUPER_ADMIN');
    }

    // Also delete all existing sessions to force re-login
    console.log('\n🔄 Clearing all sessions for this user...');
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: admin.id },
    });
    console.log(`✅ Deleted ${deletedSessions.count} session(s)`);
    console.log('\n💡 Please sign in again to create a new session with the role field');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminRole();
