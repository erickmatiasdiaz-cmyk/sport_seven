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
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    await prisma.user.createMany({
      data: [
        {
          name: 'Administrador',
          email: 'admin@sportseven.cl',
          password: adminPassword,
          role: 'admin',
        },
        {
          name: 'Juan Pérez',
          email: 'usuario@sportseven.cl',
          phone: '+56912345678',
          password: userPassword,
          role: 'user',
        },
      ],
    });
  }

  if (courtCount === 0) {
    await prisma.court.createMany({
      data: [
        {
          name: 'Cancha Fútbol 1',
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
          name: 'Cancha Fútbol 2',
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
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}
