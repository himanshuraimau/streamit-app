import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSettings() {
  console.log('Seeding system settings...');

  // Get super admin user ID
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'admin@streamit.com' },
  });

  if (!superAdmin) {
    console.error('Super admin not found. Please run seed-admin.ts first.');
    process.exit(1);
  }

  const defaultSettings = [
    // General Settings
    {
      key: 'general.platform_name',
      value: 'StreamIt',
      description: 'Platform display name',
      updatedBy: superAdmin.id,
    },
    {
      key: 'general.maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode to prevent user access',
      updatedBy: superAdmin.id,
    },
    {
      key: 'general.max_upload_size_mb',
      value: '100',
      description: 'Maximum file upload size in megabytes',
      updatedBy: superAdmin.id,
    },

    // Moderation Settings
    {
      key: 'moderation.auto_flag_threshold',
      value: '5',
      description: 'Number of reports before content is auto-flagged',
      updatedBy: superAdmin.id,
    },
    {
      key: 'moderation.require_manual_review',
      value: 'true',
      description: 'Require manual review for flagged content',
      updatedBy: superAdmin.id,
    },

    // Monetization Settings
    {
      key: 'monetization.min_withdrawal_amount',
      value: '1000',
      description: 'Minimum coins required for withdrawal',
      updatedBy: superAdmin.id,
    },
    {
      key: 'monetization.withdrawal_fee_percent',
      value: '5',
      description: 'Withdrawal fee percentage',
      updatedBy: superAdmin.id,
    },
    {
      key: 'monetization.coin_to_currency_rate',
      value: '0.01',
      description: 'Conversion rate from coins to USD',
      updatedBy: superAdmin.id,
    },

    // Streaming Settings
    {
      key: 'streaming.max_bitrate_kbps',
      value: '6000',
      description: 'Maximum streaming bitrate in kbps',
      updatedBy: superAdmin.id,
    },
    {
      key: 'streaming.max_concurrent_viewers',
      value: '10000',
      description: 'Maximum concurrent viewers per stream',
      updatedBy: superAdmin.id,
    },
    {
      key: 'streaming.enable_recording',
      value: 'true',
      description: 'Allow streamers to record their streams',
      updatedBy: superAdmin.id,
    },

    // Compliance Settings
    {
      key: 'compliance.data_retention_days',
      value: '90',
      description: 'Number of days to retain user data',
      updatedBy: superAdmin.id,
    },
    {
      key: 'compliance.enable_geo_blocking',
      value: 'true',
      description: 'Enable geographic content blocking',
      updatedBy: superAdmin.id,
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`✓ Created ${defaultSettings.length} system settings`);
}

seedSettings()
  .catch((e) => {
    console.error('Error seeding settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
