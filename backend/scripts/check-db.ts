import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== COIN PACKAGES ===');
  const packages = await prisma.coinPackage.findMany({ orderBy: { sortOrder: 'asc' } });
  console.table(packages.map(p => ({
    id: p.id.slice(0, 8) + '...',
    name: p.name,
    coins: p.coins,
    bonusCoins: p.bonusCoins,
    price: p.price / 100 + ' INR',
    isActive: p.isActive
  })));

  console.log('\n=== DISCOUNT CODES ===');
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  console.table(codes.map(c => ({
    code: c.code,
    type: c.discountType,
    value: c.discountType === 'PERCENTAGE' ? c.discountValue + '%' : (c.discountValue / 100) + ' INR',
    codeType: c.codeType,
    maxRedemptions: c.maxRedemptions ?? 'unlimited',
    currentRedemptions: c.currentRedemptions,
    minPurchase: c.minPurchaseAmount ? (c.minPurchaseAmount / 100) + ' INR' : 'none',
    expiresAt: c.expiresAt?.toISOString().split('T')[0] ?? 'never',
    isActive: c.isActive
  })));

  console.log('\n=== DISCOUNT REDEMPTIONS ===');
  const redemptions = await prisma.discountRedemption.findMany({
    include: { discountCode: true, user: { select: { username: true } } }
  });
  if (redemptions.length === 0) {
    console.log('No redemptions yet');
  } else {
    console.table(redemptions.map(r => ({
      code: r.discountCode.code,
      user: r.user.username,
      bonusCoins: r.bonusCoinsAwarded,
      createdAt: r.createdAt.toISOString().split('T')[0]
    })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
