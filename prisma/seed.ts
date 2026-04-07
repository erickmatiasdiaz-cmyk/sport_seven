import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Delete existing data
  await prisma.reservation.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.court.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@sportseven.cl',
      password: adminPassword,
      role: 'admin',
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Juan Pérez',
      email: 'usuario@sportseven.cl',
      phone: '+56912345678',
      password: userPassword,
      role: 'user',
    },
  });

  console.log('Created users:', adminUser.email, '(admin)', regularUser.email, '(user)');

  // Create courts
  const court1 = await prisma.court.create({
    data: {
      name: 'Cancha Fútbol 1',
      price60: 20000,
      price90: 30000,
      openingTime: '18:00',
      closingTime: '23:00',
      allows60: true,
      allows90: false,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=250&fit=crop',
    },
  });

  const court2 = await prisma.court.create({
    data: {
      name: 'Cancha Fútbol 2',
      price60: 20000,
      price90: 30000,
      openingTime: '18:00',
      closingTime: '23:00',
      allows60: true,
      allows90: false,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=250&fit=crop',
    },
  });

  console.log('Created courts:', court1.name, court2.name);

  // Create some sample reservations for today
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  await prisma.reservation.create({
    data: {
      userId: regularUser.id,
      courtId: court1.id,
      customerName: 'Juan Pérez',
      customerPhone: '+56912345678',
      date: dateStr,
      startTime: '18:00',
      endTime: '19:00',
      status: 'confirmed',
    },
  });

  await prisma.reservation.create({
    data: {
      userId: regularUser.id,
      courtId: court2.id,
      customerName: 'Juan Pérez',
      customerPhone: '+56912345678',
      date: dateStr,
      startTime: '20:00',
      endTime: '21:00',
      status: 'confirmed',
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('========================================');
  console.log('  CREDENCIALES DE PRUEBA:');
  console.log('========================================');
  console.log('  Admin:  admin@sportseven.cl / admin123');
  console.log('  User:   usuario@sportseven.cl / user123');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
