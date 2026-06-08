import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Skipping admin seed: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are not set.');
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Administrador',
      email,
      password: passwordHash,
      role: 'admin',
    },
  });
}

async function ensureCourt(params: {
  name: string;
  image: string;
  price60: number;
  price90: number;
  openingTime: string;
  closingTime: string;
  allows60: boolean;
  allows90: boolean;
  isActive: boolean;
}) {
  const existingCourt = await prisma.court.findFirst({
    where: { name: params.name },
  });

  if (existingCourt) {
    return existingCourt;
  }

  return prisma.court.create({
    data: params,
  });
}

async function main() {
  const adminUser = await ensureAdmin();
  const sharedSchedule = {
    openingTime: '14:00',
    closingTime: '23:00',
  };

  const court1 = await ensureCourt({
    name: 'Cancha Futbol 1',
    price60: 20000,
    price90: 30000,
    allows60: true,
    allows90: false,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=250&fit=crop',
    ...sharedSchedule,
  });

  const court2 = await ensureCourt({
    name: 'Cancha Futbol 2',
    price60: 20000,
    price90: 30000,
    allows60: true,
    allows90: false,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=250&fit=crop',
    ...sharedSchedule,
  });

  console.log('Seed completed successfully.');
  if (adminUser) console.log('Admin ready:', adminUser.email);
  console.log('Courts ready:', court1.name, court2.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
