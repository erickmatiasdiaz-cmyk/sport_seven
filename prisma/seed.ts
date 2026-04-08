import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureUser(params: {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);

  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      name: params.name,
      email: params.email,
      phone: params.phone,
      password: passwordHash,
      role: params.role,
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
  const adminUser = await ensureUser({
    name: 'Administrador',
    email: 'admin@sportseven.cl',
    password: 'admin123',
    role: 'admin',
  });

  const regularUser = await ensureUser({
    name: 'Juan Pérez',
    email: 'usuario@sportseven.cl',
    phone: '+56912345678',
    password: 'user123',
    role: 'user',
  });

  const sharedSchedule = {
    openingTime: '14:00',
    closingTime: '23:00',
  };

  const court1 = await ensureCourt({
    name: 'Cancha Fútbol 1',
    price60: 20000,
    price90: 30000,
    allows60: true,
    allows90: false,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=250&fit=crop',
    ...sharedSchedule,
  });

  const court2 = await ensureCourt({
    name: 'Cancha Fútbol 2',
    price60: 20000,
    price90: 30000,
    allows60: true,
    allows90: false,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=250&fit=crop',
    ...sharedSchedule,
  });

  console.log('Bootstrap completed successfully!');
  console.log('Users ready:', adminUser.email, regularUser.email);
  console.log('Courts ready:', court1.name, court2.name);
  console.log('Admin login: admin@sportseven.cl / admin123');
  console.log('User login: usuario@sportseven.cl / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
