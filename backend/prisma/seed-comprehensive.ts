import {
  ApplicationStatus,
  ContentCategory,
  DiscountType,
  IDType,
  CodeType,
  MediaType,
  PostType,
  PurchaseStatus,
  ReportReason,
  ReportStatus,
  StreamReportReason,
  StreamReportStatus,
  UserRole,
  WithdrawalStatus,
} from '@prisma/client';
import {
  disconnectSeedHelpers,
  ensureAuthUser,
  ensureWallet,
  prisma,
  resetSeedDatabase,
} from './seed-helpers';

type SeedUser = {
  key: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  bio: string;
  age?: number;
  lastLoginAt: Date;
};

const args = new Set(process.argv.slice(2));
const shouldReset = args.has('--reset') || args.has('--reset-only');
const resetOnly = args.has('--reset-only');
const dryRun = args.has('--dry-run');

const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const adminUsers: SeedUser[] = [
  {
    key: 'superAdmin',
    name: 'Super Admin',
    email: 'admin@streamit.com',
    username: 'superadmin',
    password: 'Admin@12345',
    role: UserRole.SUPER_ADMIN,
    bio: 'Primary platform administrator for backend verification.',
    lastLoginAt: hoursAgo(2),
  },
  {
    key: 'moderator',
    name: 'Content Moderator',
    email: 'moderator@streamit.com',
    username: 'moderator',
    password: 'Moderator@123',
    role: UserRole.MODERATOR,
    bio: 'Handles moderation queues and report resolution.',
    lastLoginAt: hoursAgo(6),
  },
  {
    key: 'financeAdmin',
    name: 'Finance Admin',
    email: 'finance@streamit.com',
    username: 'financeadmin',
    password: 'Finance@12345',
    role: UserRole.FINANCE_ADMIN,
    bio: 'Reviews purchases, gifts, and withdrawals.',
    lastLoginAt: daysAgo(1),
  },
  {
    key: 'supportAdmin',
    name: 'Support Admin',
    email: 'support@streamit.com',
    username: 'supportadmin',
    password: 'Support@12345',
    role: UserRole.ADMIN,
    bio: 'Handles user management and support flows.',
    lastLoginAt: daysAgo(2),
  },
  {
    key: 'complianceOfficer',
    name: 'Compliance Officer',
    email: 'compliance@streamit.com',
    username: 'compliance',
    password: 'Compliance@123',
    role: UserRole.COMPLIANCE_OFFICER,
    bio: 'Reviews geo blocks and compliance settings.',
    lastLoginAt: daysAgo(3),
  },
];

const viewerUsers: SeedUser[] = [
  {
    key: 'viewerOne',
    name: 'Aarav Viewer',
    email: 'viewer.one@streamit.com',
    username: 'aaravviewer',
    password: 'Viewer@12345',
    role: UserRole.USER,
    bio: 'Regular viewer used for likes, comments, gifts, and checkout flows.',
    age: 24,
    lastLoginAt: hoursAgo(1),
  },
  {
    key: 'viewerTwo',
    name: 'Mira Viewer',
    email: 'viewer.two@streamit.com',
    username: 'miraviewer',
    password: 'Viewer@12345',
    role: UserRole.USER,
    bio: 'Second viewer used for follows and report testing.',
    age: 26,
    lastLoginAt: daysAgo(1),
  },
  {
    key: 'reporter',
    name: 'Kabir Reporter',
    email: 'reporter@streamit.com',
    username: 'kabirreporter',
    password: 'Viewer@12345',
    role: UserRole.USER,
    bio: 'User focused on moderation and report scenarios.',
    age: 29,
    lastLoginAt: daysAgo(4),
  },
  {
    key: 'applicant',
    name: 'Niya Applicant',
    email: 'applicant@streamit.com',
    username: 'niyaapplicant',
    password: 'Viewer@12345',
    role: UserRole.USER,
    bio: 'Pending creator applicant for creator workflow testing.',
    age: 22,
    lastLoginAt: daysAgo(5),
  },
];

const creatorUsers: SeedUser[] = [
  {
    key: 'gamingCreator',
    name: 'Rohan Plays',
    email: 'rohan.creator@streamit.com',
    username: 'rohanplays',
    password: 'Creator@12345',
    role: UserRole.CREATOR,
    bio: 'Approved gaming creator with an active live stream.',
    age: 27,
    lastLoginAt: hoursAgo(3),
  },
  {
    key: 'musicCreator',
    name: 'Sara Sounds',
    email: 'sara.creator@streamit.com',
    username: 'sarasounds',
    password: 'Creator@12345',
    role: UserRole.CREATOR,
    bio: 'Approved music creator with completed posts and withdrawals.',
    age: 25,
    lastLoginAt: daysAgo(1),
  },
];

function printDryRun() {
  console.log('Dry run only. The lean backend seed would create:');
  console.log(`- ${adminUsers.length} Better Auth admin users`);
  console.log(`- ${viewerUsers.length} Better Auth regular users`);
  console.log(`- ${creatorUsers.length} Better Auth creator users`);
  console.log('- 3 coin packages, 3 gifts, 2 discount codes');
  console.log('- 3 creator applications (2 approved, 1 pending)');
  console.log('- 2 streams with stats, 4 posts, 4 likes, 3 comments');
  console.log('- 3 purchases, 3 gift transactions, 2 withdrawals');
  console.log('- 2 reports, 1 stream report, 2 audit log entries');
  console.log('- 1 ad creative, 1 geo block, 9 system settings');
}

async function main() {
  console.log('🌱 Starting lean backend seed...\n');

  if (dryRun) {
    printDryRun();
    return;
  }

  if (shouldReset) {
    console.log('🧹 Clearing existing seed data...');
    await resetSeedDatabase();
    console.log('✅ Existing seed data cleared\n');
  }

  if (resetOnly) {
    console.log('Reset complete. No new data was seeded.');
    return;
  }

  console.log('👤 Creating Better Auth users...');

  const users = new Map<string, Awaited<ReturnType<typeof ensureAuthUser>>>();

  for (const definition of [...adminUsers, ...viewerUsers, ...creatorUsers]) {
    const user = await ensureAuthUser({
      ...definition,
      lastLoginIp: '127.0.0.1',
    });
    users.set(definition.key, user);
    console.log(`   ✓ ${definition.email}`);
  }

  const superAdmin = users.get('superAdmin');
  const moderator = users.get('moderator');
  const financeAdmin = users.get('financeAdmin');
  const viewerOne = users.get('viewerOne');
  const viewerTwo = users.get('viewerTwo');
  const reporter = users.get('reporter');
  const applicant = users.get('applicant');
  const gamingCreator = users.get('gamingCreator');
  const musicCreator = users.get('musicCreator');

  if (
    !superAdmin ||
    !moderator ||
    !financeAdmin ||
    !viewerOne ||
    !viewerTwo ||
    !reporter ||
    !applicant ||
    !gamingCreator ||
    !musicCreator
  ) {
    throw new Error('Failed to create the required seed users.');
  }

  console.log('\n💰 Creating wallets...');

  await ensureWallet(viewerOne.id, { balance: 1800, totalSpent: 600 });
  await ensureWallet(viewerTwo.id, { balance: 900, totalSpent: 350 });
  await ensureWallet(reporter.id, { balance: 400, totalSpent: 120 });
  await ensureWallet(applicant.id, { balance: 150, totalSpent: 0 });
  await ensureWallet(gamingCreator.id, { balance: 5200, totalEarned: 7800, totalSpent: 0 });
  await ensureWallet(musicCreator.id, { balance: 3100, totalEarned: 6400, totalSpent: 0 });

  console.log('✅ Wallets ready');

  console.log('\n💎 Creating packages, gifts, discounts, and settings...');

  await prisma.coinPackage.upsert({
    where: { id: 'pdt_1PAmkl5yyS9V5GzNEdpoH' },
    update: {
      name: 'Starter Pack',
      coins: 100,
      price: 9900,
      bonusCoins: 0,
      currency: 'INR',
      description: 'Starter purchase for checkout testing',
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: 'pdt_1PAmkl5yyS9V5GzNEdpoH',
      name: 'Starter Pack',
      coins: 100,
      price: 9900,
      bonusCoins: 0,
      currency: 'INR',
      description: 'Starter purchase for checkout testing',
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.coinPackage.upsert({
    where: { id: 'pdt_L70RW0ZIK6mX0Oj529rOe' },
    update: {
      name: 'Popular Pack',
      coins: 500,
      price: 49900,
      bonusCoins: 50,
      currency: 'INR',
      description: 'Most-used package in the lean seed',
      sortOrder: 2,
      isActive: true,
    },
    create: {
      id: 'pdt_L70RW0ZIK6mX0Oj529rOe',
      name: 'Popular Pack',
      coins: 500,
      price: 49900,
      bonusCoins: 50,
      currency: 'INR',
      description: 'Most-used package in the lean seed',
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.coinPackage.upsert({
    where: { id: 'pdt_hQs5ujkfVmQn7yiiQgu3i' },
    update: {
      name: 'Premium Pack',
      coins: 1000,
      price: 99900,
      bonusCoins: 150,
      currency: 'INR',
      description: 'High-value package for ledger testing',
      sortOrder: 3,
      isActive: true,
    },
    create: {
      id: 'pdt_hQs5ujkfVmQn7yiiQgu3i',
      name: 'Premium Pack',
      coins: 1000,
      price: 99900,
      bonusCoins: 150,
      currency: 'INR',
      description: 'High-value package for ledger testing',
      sortOrder: 3,
      isActive: true,
    },
  });

  await prisma.gift.upsert({
    where: { id: 'seed-gift-heart' },
    update: {
      name: 'Heart',
      description: 'Low-cost gift',
      coinPrice: 10,
      imageUrl: '/gifts/heart.png',
      animationUrl: '/gifts/heart.json',
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: 'seed-gift-heart',
      name: 'Heart',
      description: 'Low-cost gift',
      coinPrice: 10,
      imageUrl: '/gifts/heart.png',
      animationUrl: '/gifts/heart.json',
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.gift.upsert({
    where: { id: 'seed-gift-diamond' },
    update: {
      name: 'Diamond',
      description: 'Mid-tier gift',
      coinPrice: 100,
      imageUrl: '/gifts/diamond.png',
      animationUrl: '/gifts/diamond.json',
      sortOrder: 2,
      isActive: true,
    },
    create: {
      id: 'seed-gift-diamond',
      name: 'Diamond',
      description: 'Mid-tier gift',
      coinPrice: 100,
      imageUrl: '/gifts/diamond.png',
      animationUrl: '/gifts/diamond.json',
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.gift.upsert({
    where: { id: 'seed-gift-rocket' },
    update: {
      name: 'Rocket',
      description: 'High-value gift',
      coinPrice: 500,
      imageUrl: '/gifts/rocket.png',
      animationUrl: '/gifts/rocket.json',
      sortOrder: 3,
      isActive: true,
    },
    create: {
      id: 'seed-gift-rocket',
      name: 'Rocket',
      description: 'High-value gift',
      coinPrice: 500,
      imageUrl: '/gifts/rocket.png',
      animationUrl: '/gifts/rocket.json',
      sortOrder: 3,
      isActive: true,
    },
  });

  const welcomeDiscountCode = await prisma.discountCode.upsert({
    where: { code: 'WELCOME10' },
    update: {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      codeType: CodeType.PROMOTIONAL,
      createdBy: superAdmin.id,
      maxRedemptions: 100,
      currentRedemptions: 1,
      isOneTimeUse: false,
      minPurchaseAmount: 9900,
      expiresAt: daysAgo(-60),
      isActive: true,
      description: '10% bonus coin reward for seed testing',
    },
    create: {
      code: 'WELCOME10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      codeType: CodeType.PROMOTIONAL,
      createdBy: superAdmin.id,
      maxRedemptions: 100,
      currentRedemptions: 1,
      isOneTimeUse: false,
      minPurchaseAmount: 9900,
      expiresAt: daysAgo(-60),
      isActive: true,
      description: '10% bonus coin reward for seed testing',
    },
  });

  await prisma.discountCode.upsert({
    where: { code: 'BOOST50' },
    update: {
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      codeType: CodeType.PROMOTIONAL,
      createdBy: superAdmin.id,
      maxRedemptions: 25,
      currentRedemptions: 0,
      isOneTimeUse: false,
      minPurchaseAmount: 49900,
      expiresAt: daysAgo(-45),
      isActive: true,
      description: 'Fixed-value code for package testing',
    },
    create: {
      code: 'BOOST50',
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      codeType: CodeType.PROMOTIONAL,
      createdBy: superAdmin.id,
      maxRedemptions: 25,
      currentRedemptions: 0,
      isOneTimeUse: false,
      minPurchaseAmount: 49900,
      expiresAt: daysAgo(-45),
      isActive: true,
      description: 'Fixed-value code for package testing',
    },
  });

  const settings = [
    ['general.platform_name', 'StreamIt', 'Display name for the platform', true],
    ['general.maintenance_mode', 'false', 'Toggle maintenance mode', false],
    ['general.registration_enabled', 'true', 'Allow new user signups', true],
    ['moderation.content_flag_threshold', '3', 'Auto-flag threshold', false],
    ['moderation.auto_ban_strike_count', '5', 'Auto-ban strike threshold', false],
    ['monetization.minimum_withdrawal_amount', '1000', 'Minimum withdrawal coins', false],
    ['monetization.platform_fee_percentage', '10', 'Platform fee percent', false],
    ['streaming.maximum_stream_duration', '14400', 'Maximum stream duration in seconds', false],
    ['compliance.data_retention_days', '90', 'Retention period for compliance data', false],
    ['finance.coinToPaiseRate', '100', 'Coin to paise conversion used by backend services', false],
  ] as const;

  for (const [key, value, description, isPublic] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description,
        isPublic,
        updatedBy: superAdmin.id,
      },
      create: {
        key,
        value,
        description,
        isPublic,
        updatedBy: superAdmin.id,
      },
    });
  }

  console.log('✅ Monetization and settings ready');

  console.log('\n🧾 Creating creator applications...');

  await prisma.creatorApplication.upsert({
    where: { userId: gamingCreator.id },
    update: {
      status: ApplicationStatus.APPROVED,
      submittedAt: daysAgo(14),
      reviewedAt: daysAgo(10),
      reviewedBy: superAdmin.id,
      rejectionReason: null,
      identity: {
        upsert: {
          update: {
            idType: IDType.AADHAAR,
            idDocumentUrl: 'https://example.com/seed/rohan-id.jpg',
            selfiePhotoUrl: 'https://example.com/seed/rohan-selfie.jpg',
            isVerified: true,
            verifiedAt: daysAgo(10),
            verifiedBy: superAdmin.id,
          },
          create: {
            idType: IDType.AADHAAR,
            idDocumentUrl: 'https://example.com/seed/rohan-id.jpg',
            selfiePhotoUrl: 'https://example.com/seed/rohan-selfie.jpg',
            isVerified: true,
            verifiedAt: daysAgo(10),
            verifiedBy: superAdmin.id,
          },
        },
      },
      financial: {
        upsert: {
          update: {
            accountHolderName: gamingCreator.name,
            accountNumber: '123456789012',
            ifscCode: 'SBIN0001234',
            panNumber: 'ABCDE1234F',
            isVerified: true,
            verifiedAt: daysAgo(10),
            verifiedBy: financeAdmin.id,
          },
          create: {
            accountHolderName: gamingCreator.name,
            accountNumber: '123456789012',
            ifscCode: 'SBIN0001234',
            panNumber: 'ABCDE1234F',
            isVerified: true,
            verifiedAt: daysAgo(10),
            verifiedBy: financeAdmin.id,
          },
        },
      },
      profile: {
        upsert: {
          update: {
            profilePictureUrl: 'https://example.com/seed/rohan-profile.jpg',
            bio: 'Gaming creator focused on live sessions and short clips.',
            categories: [ContentCategory.GAMING, ContentCategory.ENTERTAINMENT],
          },
          create: {
            profilePictureUrl: 'https://example.com/seed/rohan-profile.jpg',
            bio: 'Gaming creator focused on live sessions and short clips.',
            categories: [ContentCategory.GAMING, ContentCategory.ENTERTAINMENT],
          },
        },
      },
    },
    create: {
      userId: gamingCreator.id,
      status: ApplicationStatus.APPROVED,
      submittedAt: daysAgo(14),
      reviewedAt: daysAgo(10),
      reviewedBy: superAdmin.id,
      identity: {
        create: {
          idType: IDType.AADHAAR,
          idDocumentUrl: 'https://example.com/seed/rohan-id.jpg',
          selfiePhotoUrl: 'https://example.com/seed/rohan-selfie.jpg',
          isVerified: true,
          verifiedAt: daysAgo(10),
          verifiedBy: superAdmin.id,
        },
      },
      financial: {
        create: {
          accountHolderName: gamingCreator.name,
          accountNumber: '123456789012',
          ifscCode: 'SBIN0001234',
          panNumber: 'ABCDE1234F',
          isVerified: true,
          verifiedAt: daysAgo(10),
          verifiedBy: financeAdmin.id,
        },
      },
      profile: {
        create: {
          profilePictureUrl: 'https://example.com/seed/rohan-profile.jpg',
          bio: 'Gaming creator focused on live sessions and short clips.',
          categories: [ContentCategory.GAMING, ContentCategory.ENTERTAINMENT],
        },
      },
    },
  });

  await prisma.creatorApplication.upsert({
    where: { userId: musicCreator.id },
    update: {
      status: ApplicationStatus.APPROVED,
      submittedAt: daysAgo(18),
      reviewedAt: daysAgo(12),
      reviewedBy: superAdmin.id,
      rejectionReason: null,
      identity: {
        upsert: {
          update: {
            idType: IDType.PASSPORT,
            idDocumentUrl: 'https://example.com/seed/sara-id.jpg',
            selfiePhotoUrl: 'https://example.com/seed/sara-selfie.jpg',
            isVerified: true,
            verifiedAt: daysAgo(12),
            verifiedBy: superAdmin.id,
          },
          create: {
            idType: IDType.PASSPORT,
            idDocumentUrl: 'https://example.com/seed/sara-id.jpg',
            selfiePhotoUrl: 'https://example.com/seed/sara-selfie.jpg',
            isVerified: true,
            verifiedAt: daysAgo(12),
            verifiedBy: superAdmin.id,
          },
        },
      },
      financial: {
        upsert: {
          update: {
            accountHolderName: musicCreator.name,
            accountNumber: '987654321098',
            ifscCode: 'HDFC0005678',
            panNumber: 'PQRSX5678K',
            isVerified: true,
            verifiedAt: daysAgo(12),
            verifiedBy: financeAdmin.id,
          },
          create: {
            accountHolderName: musicCreator.name,
            accountNumber: '987654321098',
            ifscCode: 'HDFC0005678',
            panNumber: 'PQRSX5678K',
            isVerified: true,
            verifiedAt: daysAgo(12),
            verifiedBy: financeAdmin.id,
          },
        },
      },
      profile: {
        upsert: {
          update: {
            profilePictureUrl: 'https://example.com/seed/sara-profile.jpg',
            bio: 'Music creator for content, livestream, and payout testing.',
            categories: [ContentCategory.MUSIC, ContentCategory.ENTERTAINMENT],
          },
          create: {
            profilePictureUrl: 'https://example.com/seed/sara-profile.jpg',
            bio: 'Music creator for content, livestream, and payout testing.',
            categories: [ContentCategory.MUSIC, ContentCategory.ENTERTAINMENT],
          },
        },
      },
    },
    create: {
      userId: musicCreator.id,
      status: ApplicationStatus.APPROVED,
      submittedAt: daysAgo(18),
      reviewedAt: daysAgo(12),
      reviewedBy: superAdmin.id,
      identity: {
        create: {
          idType: IDType.PASSPORT,
          idDocumentUrl: 'https://example.com/seed/sara-id.jpg',
          selfiePhotoUrl: 'https://example.com/seed/sara-selfie.jpg',
          isVerified: true,
          verifiedAt: daysAgo(12),
          verifiedBy: superAdmin.id,
        },
      },
      financial: {
        create: {
          accountHolderName: musicCreator.name,
          accountNumber: '987654321098',
          ifscCode: 'HDFC0005678',
          panNumber: 'PQRSX5678K',
          isVerified: true,
          verifiedAt: daysAgo(12),
          verifiedBy: financeAdmin.id,
        },
      },
      profile: {
        create: {
          profilePictureUrl: 'https://example.com/seed/sara-profile.jpg',
          bio: 'Music creator for content, livestream, and payout testing.',
          categories: [ContentCategory.MUSIC, ContentCategory.ENTERTAINMENT],
        },
      },
    },
  });

  await prisma.creatorApplication.upsert({
    where: { userId: applicant.id },
    update: {
      status: ApplicationStatus.PENDING,
      submittedAt: daysAgo(3),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      identity: {
        upsert: {
          update: {
            idType: IDType.DRIVERS_LICENSE,
            idDocumentUrl: 'https://example.com/seed/niya-id.jpg',
            selfiePhotoUrl: 'https://example.com/seed/niya-selfie.jpg',
            isVerified: false,
            verifiedAt: null,
            verifiedBy: null,
          },
          create: {
            idType: IDType.DRIVERS_LICENSE,
            idDocumentUrl: 'https://example.com/seed/niya-id.jpg',
            selfiePhotoUrl: 'https://example.com/seed/niya-selfie.jpg',
            isVerified: false,
            verifiedAt: null,
            verifiedBy: null,
          },
        },
      },
      financial: {
        upsert: {
          update: {
            accountHolderName: applicant.name,
            accountNumber: '222233334444',
            ifscCode: 'ICIC0002222',
            panNumber: 'LMNOP4321Q',
            isVerified: false,
            verifiedAt: null,
            verifiedBy: null,
          },
          create: {
            accountHolderName: applicant.name,
            accountNumber: '222233334444',
            ifscCode: 'ICIC0002222',
            panNumber: 'LMNOP4321Q',
            isVerified: false,
            verifiedAt: null,
            verifiedBy: null,
          },
        },
      },
      profile: {
        upsert: {
          update: {
            profilePictureUrl: 'https://example.com/seed/niya-profile.jpg',
            bio: 'Pending application for creator onboarding flow.',
            categories: [ContentCategory.LIFESTYLE, ContentCategory.ART],
          },
          create: {
            profilePictureUrl: 'https://example.com/seed/niya-profile.jpg',
            bio: 'Pending application for creator onboarding flow.',
            categories: [ContentCategory.LIFESTYLE, ContentCategory.ART],
          },
        },
      },
    },
    create: {
      userId: applicant.id,
      status: ApplicationStatus.PENDING,
      submittedAt: daysAgo(3),
      identity: {
        create: {
          idType: IDType.DRIVERS_LICENSE,
          idDocumentUrl: 'https://example.com/seed/niya-id.jpg',
          selfiePhotoUrl: 'https://example.com/seed/niya-selfie.jpg',
          isVerified: false,
        },
      },
      financial: {
        create: {
          accountHolderName: applicant.name,
          accountNumber: '222233334444',
          ifscCode: 'ICIC0002222',
          panNumber: 'LMNOP4321Q',
          isVerified: false,
        },
      },
      profile: {
        create: {
          profilePictureUrl: 'https://example.com/seed/niya-profile.jpg',
          bio: 'Pending application for creator onboarding flow.',
          categories: [ContentCategory.LIFESTYLE, ContentCategory.ART],
        },
      },
    },
  });

  console.log('✅ Creator applications ready');

  console.log('\n📺 Creating streams and stats...');

  await prisma.stream.upsert({
    where: { userId: gamingCreator.id },
    update: {
      title: 'Ranked grind with live chat',
      description: 'Live now for stream, report, and gifting scenarios.',
      thumbnail: 'https://example.com/seed/stream-rohan.jpg',
      category: 'Gaming',
      tags: ['gaming', 'ranked', 'live'],
      isLive: true,
      startedAt: hoursAgo(2),
      allowGifts: true,
      allowAds: false,
      isChatEnabled: true,
    },
    create: {
      id: 'seed-stream-rohan',
      userId: gamingCreator.id,
      title: 'Ranked grind with live chat',
      description: 'Live now for stream, report, and gifting scenarios.',
      thumbnail: 'https://example.com/seed/stream-rohan.jpg',
      category: 'Gaming',
      tags: ['gaming', 'ranked', 'live'],
      isLive: true,
      startedAt: hoursAgo(2),
      allowGifts: true,
      allowAds: false,
      isChatEnabled: true,
    },
  });

  await prisma.stream.upsert({
    where: { userId: musicCreator.id },
    update: {
      title: 'Acoustic set replay',
      description: 'Completed stream for analytics and payout testing.',
      thumbnail: 'https://example.com/seed/stream-sara.jpg',
      category: 'Music',
      tags: ['music', 'acoustic'],
      isLive: false,
      startedAt: daysAgo(2),
      allowGifts: true,
      allowAds: true,
      isChatEnabled: true,
    },
    create: {
      id: 'seed-stream-sara',
      userId: musicCreator.id,
      title: 'Acoustic set replay',
      description: 'Completed stream for analytics and payout testing.',
      thumbnail: 'https://example.com/seed/stream-sara.jpg',
      category: 'Music',
      tags: ['music', 'acoustic'],
      isLive: false,
      startedAt: daysAgo(2),
      allowGifts: true,
      allowAds: true,
      isChatEnabled: true,
    },
  });

  const rohanStream = await prisma.stream.findUniqueOrThrow({
    where: { userId: gamingCreator.id },
  });

  const saraStream = await prisma.stream.findUniqueOrThrow({
    where: { userId: musicCreator.id },
  });

  await prisma.streamStats.upsert({
    where: { streamId: rohanStream.id },
    update: {
      peakViewers: 145,
      totalViewers: 112,
      totalLikes: 37,
      totalGifts: 8,
      totalCoins: 980,
      startedAt: hoursAgo(2),
      endedAt: null,
    },
    create: {
      id: 'seed-stream-stats-rohan',
      streamId: rohanStream.id,
      peakViewers: 145,
      totalViewers: 112,
      totalLikes: 37,
      totalGifts: 8,
      totalCoins: 980,
      startedAt: hoursAgo(2),
      endedAt: null,
    },
  });

  await prisma.streamStats.upsert({
    where: { streamId: saraStream.id },
    update: {
      peakViewers: 88,
      totalViewers: 76,
      totalLikes: 24,
      totalGifts: 3,
      totalCoins: 420,
      startedAt: daysAgo(2),
      endedAt: daysAgo(2 - 0.1),
    },
    create: {
      id: 'seed-stream-stats-sara',
      streamId: saraStream.id,
      peakViewers: 88,
      totalViewers: 76,
      totalLikes: 24,
      totalGifts: 3,
      totalCoins: 420,
      startedAt: daysAgo(2),
      endedAt: daysAgo(2 - 0.1),
    },
  });

  console.log('✅ Streams ready');

  console.log('\n📝 Creating posts and engagement...');

  await prisma.post.upsert({
    where: { id: 'seed-post-rohan-short' },
    update: {
      authorId: gamingCreator.id,
      content: 'Clutch ending from today’s ranked stream.',
      type: PostType.VIDEO,
      isShort: true,
      isPublic: true,
      allowComments: true,
      viewsCount: 140,
      likesCount: 3,
      commentsCount: 1,
      sharesCount: 2,
      isFlagged: false,
      flagCount: 0,
      createdAt: hoursAgo(8),
    },
    create: {
      id: 'seed-post-rohan-short',
      authorId: gamingCreator.id,
      content: 'Clutch ending from today’s ranked stream.',
      type: PostType.VIDEO,
      isShort: true,
      isPublic: true,
      allowComments: true,
      viewsCount: 140,
      likesCount: 3,
      commentsCount: 1,
      sharesCount: 2,
      isFlagged: false,
      flagCount: 0,
      createdAt: hoursAgo(8),
    },
  });

  await prisma.postMedia.upsert({
    where: { id: 'seed-post-media-rohan-short' },
    update: {
      postId: 'seed-post-rohan-short',
      url: 'https://example.com/seed/rohan-short.mp4',
      type: MediaType.VIDEO,
      mimeType: 'video/mp4',
      size: 12400000,
      width: 1080,
      height: 1920,
      duration: 42,
      thumbnailUrl: 'https://example.com/seed/rohan-short-thumb.jpg',
    },
    create: {
      id: 'seed-post-media-rohan-short',
      postId: 'seed-post-rohan-short',
      url: 'https://example.com/seed/rohan-short.mp4',
      type: MediaType.VIDEO,
      mimeType: 'video/mp4',
      size: 12400000,
      width: 1080,
      height: 1920,
      duration: 42,
      thumbnailUrl: 'https://example.com/seed/rohan-short-thumb.jpg',
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-rohan-flagged' },
    update: {
      authorId: gamingCreator.id,
      content: 'Testing a flagged moderation case for admin review.',
      type: PostType.TEXT,
      isShort: false,
      isPublic: true,
      allowComments: true,
      viewsCount: 48,
      likesCount: 0,
      commentsCount: 1,
      sharesCount: 0,
      isFlagged: true,
      flagCount: 2,
      createdAt: daysAgo(1),
    },
    create: {
      id: 'seed-post-rohan-flagged',
      authorId: gamingCreator.id,
      content: 'Testing a flagged moderation case for admin review.',
      type: PostType.TEXT,
      isShort: false,
      isPublic: true,
      allowComments: true,
      viewsCount: 48,
      likesCount: 0,
      commentsCount: 1,
      sharesCount: 0,
      isFlagged: true,
      flagCount: 2,
      createdAt: daysAgo(1),
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-sara-image' },
    update: {
      authorId: musicCreator.id,
      content: 'Set list from the acoustic session.',
      type: PostType.IMAGE,
      isShort: false,
      isPublic: true,
      allowComments: true,
      viewsCount: 92,
      likesCount: 1,
      commentsCount: 1,
      sharesCount: 1,
      isFlagged: false,
      flagCount: 0,
      createdAt: daysAgo(2),
    },
    create: {
      id: 'seed-post-sara-image',
      authorId: musicCreator.id,
      content: 'Set list from the acoustic session.',
      type: PostType.IMAGE,
      isShort: false,
      isPublic: true,
      allowComments: true,
      viewsCount: 92,
      likesCount: 1,
      commentsCount: 1,
      sharesCount: 1,
      isFlagged: false,
      flagCount: 0,
      createdAt: daysAgo(2),
    },
  });

  await prisma.postMedia.upsert({
    where: { id: 'seed-post-media-sara-image' },
    update: {
      postId: 'seed-post-sara-image',
      url: 'https://example.com/seed/sara-post.jpg',
      type: MediaType.IMAGE,
      mimeType: 'image/jpeg',
      size: 2400000,
      width: 1440,
      height: 1080,
      duration: null,
      thumbnailUrl: null,
    },
    create: {
      id: 'seed-post-media-sara-image',
      postId: 'seed-post-sara-image',
      url: 'https://example.com/seed/sara-post.jpg',
      type: MediaType.IMAGE,
      mimeType: 'image/jpeg',
      size: 2400000,
      width: 1440,
      height: 1080,
      duration: null,
      thumbnailUrl: null,
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-viewer-text' },
    update: {
      authorId: viewerOne.id,
      content: 'First test post from a regular viewer account.',
      type: PostType.TEXT,
      isShort: false,
      isPublic: true,
      allowComments: true,
      viewsCount: 18,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isFlagged: false,
      flagCount: 0,
      createdAt: daysAgo(3),
    },
    create: {
      id: 'seed-post-viewer-text',
      authorId: viewerOne.id,
      content: 'First test post from a regular viewer account.',
      type: PostType.TEXT,
      isShort: false,
      isPublic: true,
      allowComments: true,
      viewsCount: 18,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isFlagged: false,
      flagCount: 0,
      createdAt: daysAgo(3),
    },
  });

  await prisma.like.upsert({
    where: {
      userId_postId: {
        userId: viewerOne.id,
        postId: 'seed-post-rohan-short',
      },
    },
    update: { createdAt: hoursAgo(6) },
    create: {
      userId: viewerOne.id,
      postId: 'seed-post-rohan-short',
      createdAt: hoursAgo(6),
    },
  });

  await prisma.like.upsert({
    where: {
      userId_postId: {
        userId: viewerTwo.id,
        postId: 'seed-post-rohan-short',
      },
    },
    update: { createdAt: hoursAgo(5) },
    create: {
      userId: viewerTwo.id,
      postId: 'seed-post-rohan-short',
      createdAt: hoursAgo(5),
    },
  });

  await prisma.like.upsert({
    where: {
      userId_postId: {
        userId: reporter.id,
        postId: 'seed-post-rohan-short',
      },
    },
    update: { createdAt: hoursAgo(4) },
    create: {
      userId: reporter.id,
      postId: 'seed-post-rohan-short',
      createdAt: hoursAgo(4),
    },
  });

  await prisma.like.upsert({
    where: {
      userId_postId: {
        userId: viewerOne.id,
        postId: 'seed-post-sara-image',
      },
    },
    update: { createdAt: daysAgo(1) },
    create: {
      userId: viewerOne.id,
      postId: 'seed-post-sara-image',
      createdAt: daysAgo(1),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'seed-comment-rohan-short' },
    update: {
      userId: viewerOne.id,
      postId: 'seed-post-rohan-short',
      content: 'That ending was wild.',
      likesCount: 1,
      createdAt: hoursAgo(6),
    },
    create: {
      id: 'seed-comment-rohan-short',
      userId: viewerOne.id,
      postId: 'seed-post-rohan-short',
      content: 'That ending was wild.',
      likesCount: 1,
      createdAt: hoursAgo(6),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'seed-comment-rohan-flagged' },
    update: {
      userId: reporter.id,
      postId: 'seed-post-rohan-flagged',
      content: 'This should go to moderation review.',
      likesCount: 0,
      createdAt: daysAgo(1),
    },
    create: {
      id: 'seed-comment-rohan-flagged',
      userId: reporter.id,
      postId: 'seed-post-rohan-flagged',
      content: 'This should go to moderation review.',
      likesCount: 0,
      createdAt: daysAgo(1),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'seed-comment-sara-image' },
    update: {
      userId: viewerTwo.id,
      postId: 'seed-post-sara-image',
      content: 'Replay sounded great.',
      likesCount: 0,
      createdAt: daysAgo(2),
    },
    create: {
      id: 'seed-comment-sara-image',
      userId: viewerTwo.id,
      postId: 'seed-post-sara-image',
      content: 'Replay sounded great.',
      likesCount: 0,
      createdAt: daysAgo(2),
    },
  });

  await prisma.commentLike.upsert({
    where: {
      userId_commentId: {
        userId: gamingCreator.id,
        commentId: 'seed-comment-rohan-short',
      },
    },
    update: { createdAt: hoursAgo(5) },
    create: {
      userId: gamingCreator.id,
      commentId: 'seed-comment-rohan-short',
      createdAt: hoursAgo(5),
    },
  });

  await prisma.postView.upsert({
    where: { id: 'seed-post-view-1' },
    update: {
      postId: 'seed-post-rohan-short',
      userId: viewerOne.id,
      viewedAt: hoursAgo(7),
    },
    create: {
      id: 'seed-post-view-1',
      postId: 'seed-post-rohan-short',
      userId: viewerOne.id,
      viewedAt: hoursAgo(7),
    },
  });

  await prisma.postView.upsert({
    where: { id: 'seed-post-view-2' },
    update: {
      postId: 'seed-post-rohan-short',
      userId: viewerTwo.id,
      viewedAt: hoursAgo(7),
    },
    create: {
      id: 'seed-post-view-2',
      postId: 'seed-post-rohan-short',
      userId: viewerTwo.id,
      viewedAt: hoursAgo(7),
    },
  });

  await prisma.postView.upsert({
    where: { id: 'seed-post-view-3' },
    update: {
      postId: 'seed-post-sara-image',
      userId: reporter.id,
      viewedAt: daysAgo(1),
    },
    create: {
      id: 'seed-post-view-3',
      postId: 'seed-post-sara-image',
      userId: reporter.id,
      viewedAt: daysAgo(1),
    },
  });

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewerOne.id,
        followingId: gamingCreator.id,
      },
    },
    update: {},
    create: {
      followerId: viewerOne.id,
      followingId: gamingCreator.id,
    },
  });

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewerTwo.id,
        followingId: musicCreator.id,
      },
    },
    update: {},
    create: {
      followerId: viewerTwo.id,
      followingId: musicCreator.id,
    },
  });

  console.log('✅ Posts and engagement ready');

  console.log('\n💳 Creating purchases, gifts, and withdrawals...');

  await prisma.coinPurchase.upsert({
    where: { orderId: 'seed-order-001' },
    update: {
      userId: viewerOne.id,
      packageId: 'pdt_L70RW0ZIK6mX0Oj529rOe',
      coins: 500,
      bonusCoins: 50,
      totalCoins: 600,
      amount: 49900,
      currency: 'INR',
      paymentGateway: 'dodo',
      transactionId: 'seed-txn-001',
      status: PurchaseStatus.COMPLETED,
      discountCodeId: welcomeDiscountCode.id,
      discountBonusCoins: 50,
      createdAt: daysAgo(4),
    },
    create: {
      id: 'seed-purchase-001',
      userId: viewerOne.id,
      packageId: 'pdt_L70RW0ZIK6mX0Oj529rOe',
      coins: 500,
      bonusCoins: 50,
      totalCoins: 600,
      amount: 49900,
      currency: 'INR',
      paymentGateway: 'dodo',
      orderId: 'seed-order-001',
      transactionId: 'seed-txn-001',
      status: PurchaseStatus.COMPLETED,
      discountCodeId: welcomeDiscountCode.id,
      discountBonusCoins: 50,
      createdAt: daysAgo(4),
    },
  });

  await prisma.coinPurchase.upsert({
    where: { orderId: 'seed-order-002' },
    update: {
      userId: viewerTwo.id,
      packageId: 'pdt_1PAmkl5yyS9V5GzNEdpoH',
      coins: 100,
      bonusCoins: 0,
      totalCoins: 100,
      amount: 9900,
      currency: 'INR',
      paymentGateway: 'dodo',
      transactionId: 'seed-txn-002',
      status: PurchaseStatus.PENDING,
      discountBonusCoins: 0,
      createdAt: daysAgo(2),
    },
    create: {
      id: 'seed-purchase-002',
      userId: viewerTwo.id,
      packageId: 'pdt_1PAmkl5yyS9V5GzNEdpoH',
      coins: 100,
      bonusCoins: 0,
      totalCoins: 100,
      amount: 9900,
      currency: 'INR',
      paymentGateway: 'dodo',
      orderId: 'seed-order-002',
      transactionId: 'seed-txn-002',
      status: PurchaseStatus.PENDING,
      discountBonusCoins: 0,
      createdAt: daysAgo(2),
    },
  });

  await prisma.coinPurchase.upsert({
    where: { orderId: 'seed-order-003' },
    update: {
      userId: reporter.id,
      packageId: 'pdt_hQs5ujkfVmQn7yiiQgu3i',
      coins: 1000,
      bonusCoins: 150,
      totalCoins: 1150,
      amount: 99900,
      currency: 'INR',
      paymentGateway: 'dodo',
      transactionId: 'seed-txn-003',
      status: PurchaseStatus.FAILED,
      failureReason: 'Card declined in test flow',
      discountBonusCoins: 0,
      createdAt: daysAgo(1),
    },
    create: {
      id: 'seed-purchase-003',
      userId: reporter.id,
      packageId: 'pdt_hQs5ujkfVmQn7yiiQgu3i',
      coins: 1000,
      bonusCoins: 150,
      totalCoins: 1150,
      amount: 99900,
      currency: 'INR',
      paymentGateway: 'dodo',
      orderId: 'seed-order-003',
      transactionId: 'seed-txn-003',
      status: PurchaseStatus.FAILED,
      failureReason: 'Card declined in test flow',
      discountBonusCoins: 0,
      createdAt: daysAgo(1),
    },
  });

  await prisma.discountRedemption.upsert({
    where: { purchaseId: 'seed-purchase-001' },
    update: {
      discountCodeId: welcomeDiscountCode.id,
      userId: viewerOne.id,
      bonusCoinsAwarded: 50,
    },
    create: {
      id: 'seed-redemption-001',
      discountCodeId: welcomeDiscountCode.id,
      userId: viewerOne.id,
      purchaseId: 'seed-purchase-001',
      bonusCoinsAwarded: 50,
    },
  });

  await prisma.giftTransaction.upsert({
    where: { id: 'seed-gift-tx-001' },
    update: {
      senderId: viewerOne.id,
      receiverId: gamingCreator.id,
      giftId: 'seed-gift-heart',
      coinAmount: 30,
      quantity: 3,
      streamId: rohanStream.id,
      message: 'Nice clutch',
      createdAt: hoursAgo(1),
    },
    create: {
      id: 'seed-gift-tx-001',
      senderId: viewerOne.id,
      receiverId: gamingCreator.id,
      giftId: 'seed-gift-heart',
      coinAmount: 30,
      quantity: 3,
      streamId: rohanStream.id,
      message: 'Nice clutch',
      createdAt: hoursAgo(1),
    },
  });

  await prisma.giftTransaction.upsert({
    where: { id: 'seed-gift-tx-002' },
    update: {
      senderId: viewerTwo.id,
      receiverId: gamingCreator.id,
      giftId: 'seed-gift-diamond',
      coinAmount: 100,
      quantity: 1,
      streamId: rohanStream.id,
      message: 'GG',
      createdAt: hoursAgo(2),
    },
    create: {
      id: 'seed-gift-tx-002',
      senderId: viewerTwo.id,
      receiverId: gamingCreator.id,
      giftId: 'seed-gift-diamond',
      coinAmount: 100,
      quantity: 1,
      streamId: rohanStream.id,
      message: 'GG',
      createdAt: hoursAgo(2),
    },
  });

  await prisma.giftTransaction.upsert({
    where: { id: 'seed-gift-tx-003' },
    update: {
      senderId: reporter.id,
      receiverId: musicCreator.id,
      giftId: 'seed-gift-heart',
      coinAmount: 20,
      quantity: 2,
      streamId: null,
      message: 'Replay was great',
      createdAt: daysAgo(2),
    },
    create: {
      id: 'seed-gift-tx-003',
      senderId: reporter.id,
      receiverId: musicCreator.id,
      giftId: 'seed-gift-heart',
      coinAmount: 20,
      quantity: 2,
      streamId: null,
      message: 'Replay was great',
      createdAt: daysAgo(2),
    },
  });

  await prisma.creatorWithdrawalRequest.upsert({
    where: { id: 'seed-withdrawal-001' },
    update: {
      userId: gamingCreator.id,
      amountCoins: 1200,
      coinToPaiseRate: 100,
      grossAmountPaise: 120000,
      platformFeePaise: 12000,
      netAmountPaise: 108000,
      status: WithdrawalStatus.PENDING,
      requestedAt: daysAgo(1),
      reviewedAt: null,
      reviewedBy: null,
    },
    create: {
      id: 'seed-withdrawal-001',
      userId: gamingCreator.id,
      amountCoins: 1200,
      coinToPaiseRate: 100,
      grossAmountPaise: 120000,
      platformFeePaise: 12000,
      netAmountPaise: 108000,
      status: WithdrawalStatus.PENDING,
      requestedAt: daysAgo(1),
    },
  });

  await prisma.creatorWithdrawalRequest.upsert({
    where: { id: 'seed-withdrawal-002' },
    update: {
      userId: musicCreator.id,
      amountCoins: 1500,
      coinToPaiseRate: 100,
      grossAmountPaise: 150000,
      platformFeePaise: 15000,
      netAmountPaise: 135000,
      status: WithdrawalStatus.APPROVED,
      requestedAt: daysAgo(5),
      reviewedAt: daysAgo(4),
      reviewedBy: financeAdmin.id,
      approvedAt: daysAgo(4),
    },
    create: {
      id: 'seed-withdrawal-002',
      userId: musicCreator.id,
      amountCoins: 1500,
      coinToPaiseRate: 100,
      grossAmountPaise: 150000,
      platformFeePaise: 15000,
      netAmountPaise: 135000,
      status: WithdrawalStatus.APPROVED,
      requestedAt: daysAgo(5),
      reviewedAt: daysAgo(4),
      reviewedBy: financeAdmin.id,
      approvedAt: daysAgo(4),
    },
  });

  console.log('✅ Monetization records ready');

  console.log('\n🚨 Creating moderation and admin records...');

  await prisma.report.upsert({
    where: { id: 'seed-report-001' },
    update: {
      reason: ReportReason.HARASSMENT,
      description: 'Review the flagged creator post.',
      reporterId: reporter.id,
      reportedUserId: gamingCreator.id,
      postId: 'seed-post-rohan-flagged',
      status: ReportStatus.UNDER_REVIEW,
      reviewedBy: moderator.id,
      reviewedAt: hoursAgo(3),
      resolution: 'Pending moderator action',
      createdAt: daysAgo(1),
    },
    create: {
      id: 'seed-report-001',
      reason: ReportReason.HARASSMENT,
      description: 'Review the flagged creator post.',
      reporterId: reporter.id,
      reportedUserId: gamingCreator.id,
      postId: 'seed-post-rohan-flagged',
      status: ReportStatus.UNDER_REVIEW,
      reviewedBy: moderator.id,
      reviewedAt: hoursAgo(3),
      resolution: 'Pending moderator action',
      createdAt: daysAgo(1),
    },
  });

  await prisma.report.upsert({
    where: { id: 'seed-report-002' },
    update: {
      reason: ReportReason.SPAM,
      description: 'Comment spam scenario for reports details.',
      reporterId: viewerTwo.id,
      reportedUserId: reporter.id,
      commentId: 'seed-comment-rohan-flagged',
      status: ReportStatus.RESOLVED,
      reviewedBy: moderator.id,
      reviewedAt: hoursAgo(2),
      resolution: 'Comment reviewed and kept for testing.',
      createdAt: hoursAgo(10),
    },
    create: {
      id: 'seed-report-002',
      reason: ReportReason.SPAM,
      description: 'Comment spam scenario for reports details.',
      reporterId: viewerTwo.id,
      reportedUserId: reporter.id,
      commentId: 'seed-comment-rohan-flagged',
      status: ReportStatus.RESOLVED,
      reviewedBy: moderator.id,
      reviewedAt: hoursAgo(2),
      resolution: 'Comment reviewed and kept for testing.',
      createdAt: hoursAgo(10),
    },
  });

  await prisma.streamReport.upsert({
    where: { id: 'seed-stream-report-001' },
    update: {
      streamId: rohanStream.id,
      reporterId: viewerTwo.id,
      reason: StreamReportReason.SPAM,
      description: 'Seed stream report for moderator queue testing.',
      status: StreamReportStatus.PENDING,
      createdAt: hoursAgo(2),
    },
    create: {
      id: 'seed-stream-report-001',
      streamId: rohanStream.id,
      reporterId: viewerTwo.id,
      reason: StreamReportReason.SPAM,
      description: 'Seed stream report for moderator queue testing.',
      status: StreamReportStatus.PENDING,
      createdAt: hoursAgo(2),
    },
  });

  await prisma.adCreative.upsert({
    where: { id: 'seed-ad-001' },
    update: {
      title: 'Demo Creator Spotlight',
      mediaUrl: 'https://example.com/seed/ad-creator-spotlight.jpg',
      targetRegion: ['IN'],
      targetGender: 'all',
      category: 'Gaming',
      cpm: 2.5,
      frequencyCap: 3,
      isActive: true,
      createdBy: superAdmin.id,
    },
    create: {
      id: 'seed-ad-001',
      title: 'Demo Creator Spotlight',
      mediaUrl: 'https://example.com/seed/ad-creator-spotlight.jpg',
      targetRegion: ['IN'],
      targetGender: 'all',
      category: 'Gaming',
      cpm: 2.5,
      frequencyCap: 3,
      isActive: true,
      createdBy: superAdmin.id,
    },
  });

  await prisma.geoBlock.upsert({
    where: { id: 'seed-geo-block-001' },
    update: {
      region: 'CN',
      contentId: 'seed-post-rohan-flagged',
      reason: 'Compliance sandbox example',
      createdBy: superAdmin.id,
    },
    create: {
      id: 'seed-geo-block-001',
      region: 'CN',
      contentId: 'seed-post-rohan-flagged',
      reason: 'Compliance sandbox example',
      createdBy: superAdmin.id,
    },
  });

  await prisma.adminAuditLog.upsert({
    where: { id: 'seed-audit-001' },
    update: {
      adminId: moderator.id,
      action: 'report_resolve',
      targetType: 'report',
      targetId: 'seed-report-002',
      metadata: {
        status: 'resolved',
      },
      createdAt: hoursAgo(2),
    },
    create: {
      id: 'seed-audit-001',
      adminId: moderator.id,
      action: 'report_resolve',
      targetType: 'report',
      targetId: 'seed-report-002',
      metadata: {
        status: 'resolved',
      },
      createdAt: hoursAgo(2),
    },
  });

  await prisma.adminAuditLog.upsert({
    where: { id: 'seed-audit-002' },
    update: {
      adminId: financeAdmin.id,
      action: 'withdrawal_approve',
      targetType: 'withdrawal',
      targetId: 'seed-withdrawal-002',
      metadata: {
        status: 'approved',
      },
      createdAt: daysAgo(4),
    },
    create: {
      id: 'seed-audit-002',
      adminId: financeAdmin.id,
      action: 'withdrawal_approve',
      targetType: 'withdrawal',
      targetId: 'seed-withdrawal-002',
      metadata: {
        status: 'approved',
      },
      createdAt: daysAgo(4),
    },
  });

  console.log('✅ Moderation and admin records ready');

  console.log('\n' + '='.repeat(60));
  console.log('Lean backend seed completed successfully.');
  console.log('='.repeat(60));
  console.log('This seed keeps the dataset intentionally small so backend testing stays fast.');
  console.log('');
  console.log('Admin credentials:');
  for (const admin of adminUsers) {
    console.log(`- ${admin.role}: ${admin.email} / ${admin.password}`);
  }
  console.log('');
  console.log('Viewer credentials:');
  console.log('- viewer.one@streamit.com / Viewer@12345');
  console.log('- viewer.two@streamit.com / Viewer@12345');
  console.log('- reporter@streamit.com / Viewer@12345');
  console.log('');
  console.log('Creator credentials:');
  console.log('- rohan.creator@streamit.com / Creator@12345');
  console.log('- sara.creator@streamit.com / Creator@12345');
  console.log('');
  console.log('Useful commands:');
  console.log('- bun run db:reset-seed');
  console.log('- bun run db:seed');
  console.log('- bun run db:verify-seed');
}

main()
  .catch((error) => {
    console.error('❌ Lean seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectSeedHelpers();
  });
