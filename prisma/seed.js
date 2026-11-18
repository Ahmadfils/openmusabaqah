const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

async function upsertUser({ username, password, role, displayName, email, organizationId }) {
    return prisma.user.upsert({
        where: { username },
        update: {
            passwordHash: hashPassword(password),
            role,
            displayName,
            email,
            organizationId,
            isActive: true,
        },
        create: {
            username,
            passwordHash: hashPassword(password),
            role,
            displayName,
            email,
            organizationId,
            isActive: true,
        },
    });
}

async function main() {
    const organization = await prisma.organization.upsert({
        where: { email: 'admin@openmusabaqah.local' },
        update: {
            name: 'OpenMusabaqah Demo',
            slug: 'openmusabaqah-demo',
            isActive: true,
        },
        create: {
            name: 'OpenMusabaqah Demo',
            slug: 'openmusabaqah-demo',
            email: 'admin@openmusabaqah.local',
            phone: '+000000000',
            country: 'Local',
            city: 'Local',
        },
    });

    const superadmin = await upsertUser({
        username: 'superadmin',
        password: 'SuperAdmin@123',
        role: 'SUPERADMIN',
        displayName: 'Platform Superadmin',
        email: 'superadmin@openmusabaqah.local',
        organizationId: null,
    });

    const admin = await upsertUser({
        username: 'admin',
        password: 'Admin@123',
        role: 'ADMIN',
        displayName: 'Demo Organization Admin',
        email: 'admin@openmusabaqah.local',
        organizationId: organization.id,
    });

    console.log('Seed complete.');
    console.log('');
    console.log('  SUPERADMIN');
    console.log(`    username: ${superadmin.username}`);
    console.log('    password: SuperAdmin@123');
    console.log('');
    console.log('  ADMIN (organization: OpenMusabaqah Demo)');
    console.log(`    username: ${admin.username}`);
    console.log('    password: Admin@123');
    console.log('');
    console.log('Change both passwords after the first sign-in.');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
