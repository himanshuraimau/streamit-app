import { PrismaClient, type User, type UserRole } from '@prisma/client';
import { auth } from '../src/lib/auth';

export const prisma = new PrismaClient();

type SeedAuthUserInput = {
  email: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  bio?: string;
  age?: number;
  image?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  adminNotes?: string;
  isSuspended?: boolean;
};

let cachedAuthContext: any;

async function getAuthContext() {
  if (!cachedAuthContext) {
    cachedAuthContext = await (auth as any).$context;
  }

  return cachedAuthContext;
}

export async function ensureAuthUser(input: SeedAuthUserInput): Promise<User> {
  const authContext = await getAuthContext();
  const existing = await authContext.internalAdapter.findUserByEmail(input.email);
  const hashedPassword = await authContext.password.hash(input.password);

  if (existing?.user) {
    await authContext.internalAdapter.updateUser(existing.user.id, {
      name: input.name,
      username: input.username,
      role: input.role,
      bio: input.bio,
      age: input.age,
      image: input.image,
      emailVerified: true,
      lastLoginAt: input.lastLoginAt,
      lastLoginIp: input.lastLoginIp,
      adminNotes: input.adminNotes,
      isSuspended: input.isSuspended ?? false,
    });

    const accounts =
      existing.accounts ?? (await authContext.internalAdapter.findAccounts(existing.user.id));

    const hasCredentialAccount = accounts.some(
      (account: { providerId?: string }) => account.providerId === 'credential'
    );

    if (hasCredentialAccount) {
      await authContext.internalAdapter.updatePassword(existing.user.id, hashedPassword);
    } else {
      await authContext.internalAdapter.linkAccount({
        userId: existing.user.id,
        accountId: existing.user.id,
        providerId: 'credential',
        password: hashedPassword,
      });
    }

    return prisma.user.findUniqueOrThrow({
      where: { id: existing.user.id },
    });
  }

  const createdUser = await authContext.internalAdapter.createUser({
    email: input.email.toLowerCase(),
    name: input.name,
    username: input.username,
    role: input.role,
    bio: input.bio,
    age: input.age,
    image: input.image,
    emailVerified: true,
    lastLoginAt: input.lastLoginAt,
    lastLoginIp: input.lastLoginIp,
    adminNotes: input.adminNotes,
    isSuspended: input.isSuspended ?? false,
  });

  await authContext.internalAdapter.linkAccount({
    userId: createdUser.id,
    accountId: createdUser.id,
    providerId: 'credential',
    password: hashedPassword,
  });

  return prisma.user.findUniqueOrThrow({
    where: { id: createdUser.id },
  });
}

export async function resetSeedDatabase() {
  await prisma.commentLike.deleteMany();
  await prisma.report.deleteMany();
  await prisma.streamReport.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.discountRedemption.deleteMany();
  await prisma.postView.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.geoBlock.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.block.deleteMany();
  await prisma.giftTransaction.deleteMany();
  await prisma.streamStats.deleteMany();
  await prisma.post.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.creatorWithdrawalRequest.deleteMany();
  await prisma.coinPurchase.deleteMany();
  await prisma.coinWallet.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.coinPackage.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.adCreative.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.financialDetails.deleteMany();
  await prisma.identityVerification.deleteMany();
  await prisma.creatorApplication.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

export async function ensureWallet(
  userId: string,
  data: {
    balance: number;
    totalEarned?: number;
    totalSpent?: number;
  }
) {
  await prisma.coinWallet.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}

export async function disconnectSeedHelpers() {
  await prisma.$disconnect();
}
