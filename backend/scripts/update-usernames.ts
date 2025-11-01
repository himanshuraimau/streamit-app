import { prisma } from '../src/lib/db';

async function updateUsernames() {
    try {
        // Get all users to see what we have
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                name: true
            }
        });

        console.log(`Found ${allUsers.length} users in database:`);
        allUsers.forEach(user => {
            console.log(`- ${user.email}: username="${user.username}", name="${user.name}"`);
        });

        if (allUsers.length === 0) {
            console.log('No users found in database');
        }

    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateUsernames();