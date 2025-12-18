import { prisma } from '../src/lib/db';

async function seedDiscountCodes() {
  console.log('🌱 Seeding discount codes...');

  try {
    // Seed promotional discount codes
    console.log('Creating promotional discount codes...');
    const discountCodes = await prisma.discountCode.createMany({
      data: [
        {
          code: 'WELCOME20',
          discountType: 'PERCENTAGE',
          discountValue: 20, // 20% bonus coins
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: 100,
          currentRedemptions: 0,
          isOneTimeUse: true,
          expiresAt: new Date('2025-12-31T23:59:59Z'),
          isActive: true,
          description: 'Welcome discount - 20% bonus coins for new users',
        },
        {
          code: 'FLAT50',
          discountType: 'FIXED',
          discountValue: 5000, // 50 rupees worth of bonus coins (in paise)
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: 50,
          currentRedemptions: 0,
          isOneTimeUse: true,
          expiresAt: new Date('2025-06-30T23:59:59Z'),
          isActive: true,
          description: 'Flat 50 rupees worth of bonus coins',
        },
        {
          code: 'SUMMER25',
          discountType: 'PERCENTAGE',
          discountValue: 25, // 25% bonus coins
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: 200,
          currentRedemptions: 0,
          isOneTimeUse: true,
          minPurchaseAmount: 49900, // Minimum ₹499 purchase
          expiresAt: new Date('2025-08-31T23:59:59Z'),
          isActive: true,
          description: 'Summer special - 25% bonus coins on purchases ₹499+',
        },
        {
          code: 'VIP30',
          discountType: 'PERCENTAGE',
          discountValue: 30, // 30% bonus coins
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: 25,
          currentRedemptions: 0,
          isOneTimeUse: true,
          minPurchaseAmount: 99900, // Minimum ₹999 purchase
          expiresAt: new Date('2025-12-31T23:59:59Z'),
          isActive: true,
          description: 'VIP exclusive - 30% bonus coins on premium purchases',
        },
        {
          code: 'FLAT100',
          discountType: 'FIXED',
          discountValue: 10000, // 100 rupees worth of bonus coins (in paise)
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: 30,
          currentRedemptions: 0,
          isOneTimeUse: true,
          minPurchaseAmount: 99900, // Minimum ₹999 purchase
          expiresAt: new Date('2025-09-30T23:59:59Z'),
          isActive: true,
          description: 'Flat 100 rupees worth of bonus coins on ₹999+ purchases',
        },
        {
          code: 'NEWYEAR15',
          discountType: 'PERCENTAGE',
          discountValue: 15, // 15% bonus coins
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: 500,
          currentRedemptions: 0,
          isOneTimeUse: true,
          expiresAt: new Date('2026-01-31T23:59:59Z'),
          isActive: true,
          description: 'New Year special - 15% bonus coins',
        },
        {
          code: 'UNLIMITED10',
          discountType: 'PERCENTAGE',
          discountValue: 10, // 10% bonus coins
          codeType: 'PROMOTIONAL',
          createdBy: 'system',
          maxRedemptions: null, // Unlimited redemptions
          currentRedemptions: 0,
          isOneTimeUse: true, // But each user can only use once
          expiresAt: null, // Never expires
          isActive: true,
          description: 'Evergreen 10% bonus coins - unlimited uses',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${discountCodes.count} promotional discount codes`);

    console.log('✨ Discount codes seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding discount codes:', error);
    throw error;
  }
}

// Run the seed
seedDiscountCodes()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
