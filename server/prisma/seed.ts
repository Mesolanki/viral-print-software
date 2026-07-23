import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Professional bcrypt password hashing for seed
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  console.log('Starting database seeding...');

  // 1. Create Default Permissions
  const permissionsList = [
    'manage_company',
    'manage_users',
    'manage_roles',
    'manage_customers',
    'manage_products',
    'manage_purchases',
    'manage_invoices',
    'manage_payments',
    'view_reports',
    'view_ledger',
  ];

  console.log('Seeding permissions...');
  const seededPermissions = [];
  for (const permName of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { permission_name: permName },
      update: {},
      create: { permission_name: permName },
    });
    seededPermissions.push(perm);
  }

  // 2. Create Default Roles
  console.log('Seeding roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: { name: 'STAFF' },
  });

  // 3. Link permissions to roles
  console.log('Linking permissions to roles...');
  // Admin gets all permissions
  for (const perm of seededPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: perm.id,
      },
    });
  }

  // Staff gets limited permissions
  const staffPermNames = [
    'manage_customers',
    'manage_products',
    'manage_purchases',
    'manage_invoices',
    'manage_payments',
    'view_ledger',
  ];
  const staffPerms = seededPermissions.filter(p => staffPermNames.includes(p.permission_name));
  for (const perm of staffPerms) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: staffRole.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: staffRole.id,
        permission_id: perm.id,
      },
    });
  }

  // 4. Create a Default Company
  console.log('Seeding default company...');
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        company_name: 'Viral Print Software',
        gst_number: '27AAAAA0000A1Z5',
        address: '123 Main Street, Mumbai, Maharashtra',
        phone: '9876543210',
        logo: '',
      },
    });
  }

  // 5. Create a Default Admin User
  console.log('Seeding default admin user...');
  const adminUsername = 'admin';
  const hashedPassword = hashPassword('admin123'); // Default password

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      company_id: company.id,
      role_id: adminRole.id,
    },
    create: {
      username: adminUsername,
      name: 'System Administrator',
      password: hashedPassword,
      company_id: company.id,
      role_id: adminRole.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Default credentials:`);
  console.log(`Username: ${adminUsername}`);
  console.log(`Password: admin123`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
