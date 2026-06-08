import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

let bootstrapPromise: Promise<void> | null = null;

async function runBootstrap() {
  if (process.env.ENABLE_BOOTSTRAP_DEMO_DATA !== 'true') {
    return;
  }

  const [userCount, courtCount] = await Promise.all([
    prisma.user.count(),
    prisma.court.count(),
  ]);

  if (userCount === 0) {
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const adminPasswordValue = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    if (!adminEmail || !adminPasswordValue) {
      throw new Error('BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD son requeridos para bootstrap');
    }

    const adminPassword = await bcrypt.hash(adminPasswordValue, 10);

    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      },
    });
  }

  if (courtCount === 0) {
    await prisma.court.createMany({
      data: [
        {
          name: 'Cancha Futbol 1',
          image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=250&fit=crop',
          isActive: true,
          price60: 20000,
          price90: 30000,
          openingTime: '14:00',
          closingTime: '23:00',
          allows60: true,
          allows90: false,
        },
        {
          name: 'Cancha Futbol 2',
          image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=250&fit=crop',
          isActive: true,
          price60: 20000,
          price90: 30000,
          openingTime: '14:00',
          closingTime: '23:00',
          allows60: true,
          allows90: false,
        },
      ],
    });
  }
}

export async function ensureBootstrapData() {
  if (process.env.ENABLE_BOOTSTRAP_DATA !== 'true') {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}
