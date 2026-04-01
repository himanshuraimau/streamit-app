import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnalyticsData() {
  console.log('🌱 Seeding analytics data...');

  try {
    // Update user login times to simulate active users
    const users = await prisma.user.findMany({
      take: 50,
    });

    console.log(`Updating login times for ${users.length} users...`);

    // Set various login times to create DAU/MAU data
    const now = new Date();
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let lastLoginAt: Date;

      if (i < 10) {
        // 10 users logged in today (DAU)
        lastLoginAt = new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000);
      } else if (i < 30) {
        // 20 more users logged in last 7 days
        lastLoginAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      } else {
        // Rest logged in last 30 days (MAU)
        lastLoginAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt },
      });
    }

    console.log('✅ User login times updated');

    // Create some gift transactions for revenue data
    const creators = await prisma.user.findMany({
      where: { role: 'CREATOR' },
      take: 10,
    });

    const viewers = await prisma.user.findMany({
      where: { role: 'USER' },
      take: 20,
    });

    console.log(`Creating gift transactions...`);

    // Get available gifts
    const gifts = await prisma.gift.findMany({
      select: {
        id: true,
        coinPrice: true,
      },
    });
    if (gifts.length === 0) {
      console.log('⚠️  No gifts found, skipping gift transactions');
    } else {
      let giftCount = 0;
      for (const creator of creators) {
        // Each creator receives 5-15 gifts
        const numGifts = Math.floor(Math.random() * 10) + 5;

        for (let i = 0; i < numGifts; i++) {
          const viewer = viewers[Math.floor(Math.random() * viewers.length)];
          const gift = gifts[Math.floor(Math.random() * gifts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;

          // Create gift transaction in the last 30 days
          const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

          await prisma.giftTransaction.create({
            data: {
              sender: { connect: { id: viewer.id } },
              receiver: { connect: { id: creator.id } },
              gift: { connect: { id: gift.id } },
              coinAmount: gift.coinPrice * quantity,
              quantity,
              createdAt,
            },
          });

          giftCount++;
        }
      }

      console.log(`✅ Created ${giftCount} gift transactions`);
    }

    // Update post engagement metrics
    const posts = await prisma.post.findMany({
      take: 50,
    });

    console.log(`Updating engagement metrics for ${posts.length} posts...`);

    for (const post of posts) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          viewsCount: Math.floor(Math.random() * 10000) + 100,
          likesCount: Math.floor(Math.random() * 1000) + 10,
          commentsCount: Math.floor(Math.random() * 100) + 5,
          sharesCount: Math.floor(Math.random() * 50) + 1,
        },
      });
    }

    console.log('✅ Post engagement metrics updated');

    // Create/update stream stats for live streams
    const streams = await prisma.stream.findMany({
      where: { isLive: true },
      take: 5,
    });

    console.log(`Updating stats for ${streams.length} live streams...`);

    for (const stream of streams) {
      // Check if stats exist
      const existingStats = await prisma.streamStats.findUnique({
        where: { streamId: stream.id },
      });

      const statsData = {
        totalViewers: Math.floor(Math.random() * 5000) + 100,
        peakViewers: Math.floor(Math.random() * 10000) + 500,
        totalLikes: Math.floor(Math.random() * 1000) + 50,
        totalGifts: Math.floor(Math.random() * 500) + 10,
        startedAt: new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000),
      };

      if (existingStats) {
        await prisma.streamStats.update({
          where: { streamId: stream.id },
          data: statsData,
        });
      } else {
        await prisma.streamStats.create({
          data: {
            streamId: stream.id,
            ...statsData,
          },
        });
      }
    }

    console.log('✅ Stream stats updated');

    console.log('🎉 Analytics data seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAnalyticsData();
