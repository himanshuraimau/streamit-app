#!/usr/bin/env bun

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    totalUsers,
    creators,
    admins,
    creatorApplications,
    streams,
    liveStreams,
    posts,
    reports,
    streamReports,
    purchases,
    giftTransactions,
    withdrawals,
    settings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CREATOR' } }),
    prisma.user.count({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_OFFICER'],
        },
      },
    }),
    prisma.creatorApplication.count(),
    prisma.stream.count(),
    prisma.stream.count({ where: { isLive: true } }),
    prisma.post.count(),
    prisma.report.count(),
    prisma.streamReport.count(),
    prisma.coinPurchase.count(),
    prisma.giftTransaction.count(),
    prisma.creatorWithdrawalRequest.count(),
    prisma.systemSetting.count(),
  ]);

  const adminLogins = await prisma.user.findMany({
    where: {
      role: {
        in: ['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_OFFICER'],
      },
    },
    select: {
      email: true,
      role: true,
    },
    orderBy: {
      role: 'asc',
    },
  });

  console.log('Seed verification summary');
  console.log('=========================');
  console.log(`Users: ${totalUsers}`);
  console.log(`Admins: ${admins}`);
  console.log(`Creators: ${creators}`);
  console.log(`Creator applications: ${creatorApplications}`);
  console.log(`Streams: ${streams} (${liveStreams} live)`);
  console.log(`Posts: ${posts}`);
  console.log(`Reports: ${reports}`);
  console.log(`Stream reports: ${streamReports}`);
  console.log(`Coin purchases: ${purchases}`);
  console.log(`Gift transactions: ${giftTransactions}`);
  console.log(`Withdrawals: ${withdrawals}`);
  console.log(`System settings: ${settings}`);
  console.log('');
  console.log('Admin logins:');
  for (const admin of adminLogins) {
    console.log(`- ${admin.role}: ${admin.email}`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
