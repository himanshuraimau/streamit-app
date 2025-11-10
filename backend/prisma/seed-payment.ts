import { prisma } from '../src/lib/db';

async function seedPaymentData() {
  console.log('🌱 Seeding payment data...');

  try {
    // Seed coin packages with Dodo product IDs
    console.log('Creating coin packages...');
    const packages = await prisma.coinPackage.createMany({
      data: [
        {
          id: 'pdt_1PAmkl5yyS9V5GzNEdpoH', // Dodo product ID
          name: 'Starter Pack',
          coins: 100,
          price: 9900, // ₹99
          bonusCoins: 0,
          description: 'Perfect for trying out gifts',
          sortOrder: 1,
          isActive: true,
        },
        {
          id: 'pdt_L70RW0ZIK6mX0Oj529rOe', // Dodo product ID
          name: 'Popular Pack',
          coins: 500,
          price: 49900, // ₹499
          bonusCoins: 50,
          description: 'Most popular! Get 50 bonus coins',
          sortOrder: 2,
          isActive: true,
        },
        {
          id: 'pdt_hQs5ujkfVmQn7yiiQgu3i', // Dodo product ID
          name: 'Premium Pack',
          coins: 1000,
          price: 99900, // ₹999
          bonusCoins: 150,
          description: 'Best value! Get 150 bonus coins',
          sortOrder: 3,
          isActive: true,
        },
        {
          id: 'pdt_hMtRduaUdOucddrMFpIxj', // Dodo product ID
          name: 'Ultimate Pack',
          coins: 2500,
          price: 249900, // ₹2499
          bonusCoins: 500,
          description: 'For super supporters! Get 500 bonus coins',
          sortOrder: 4,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${packages.count} coin packages`);

    // Seed gifts
    console.log('Creating gifts...');
    const gifts = await prisma.gift.createMany({
      data: [
        {
          name: 'Heart',
          description: 'Show some love',
          coinPrice: 10,
          imageUrl: '/gifts/heart.png',
          animationUrl: '/gifts/heart.json',
          sortOrder: 1,
          isActive: true,
        },
        {
          name: 'Star',
          description: 'You\'re a star!',
          coinPrice: 20,
          imageUrl: '/gifts/star.png',
          animationUrl: '/gifts/star.json',
          sortOrder: 2,
          isActive: true,
        },
        {
          name: 'Fire',
          description: 'This stream is fire!',
          coinPrice: 50,
          imageUrl: '/gifts/fire.png',
          animationUrl: '/gifts/fire.json',
          sortOrder: 3,
          isActive: true,
        },
        {
          name: 'Diamond',
          description: 'Shine bright!',
          coinPrice: 100,
          imageUrl: '/gifts/diamond.png',
          animationUrl: '/gifts/diamond.json',
          sortOrder: 4,
          isActive: true,
        },
        {
          name: 'Crown',
          description: 'King/Queen of content',
          coinPrice: 250,
          imageUrl: '/gifts/crown.png',
          animationUrl: '/gifts/crown.json',
          sortOrder: 5,
          isActive: true,
        },
        {
          name: 'Rocket',
          description: 'To the moon!',
          coinPrice: 500,
          imageUrl: '/gifts/rocket.png',
          animationUrl: '/gifts/rocket.json',
          sortOrder: 6,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${gifts.count} gifts`);

    console.log('✨ Payment data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding payment data:', error);
    throw error;
  }
}

// Run the seed
seedPaymentData()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
