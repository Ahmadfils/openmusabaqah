import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

try {
    prisma =
        globalForPrisma.prisma ||
        new PrismaClient({
            log: ['query', 'error', 'warn'],
        });
    console.log('Prisma Client initialized successfully in lib/prisma');
} catch (e) {
    console.error('Prisma Client failed to initialize in lib/prisma:', e);
    throw e;
}

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
