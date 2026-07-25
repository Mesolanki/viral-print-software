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

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// ============================================================
// ROLE → PERMISSIONS MATRIX
// ============================================================
// Permissions list
const ALL_PERMISSIONS = [
  'dashboard',
  'manage_users',
  'manage_customers',
  'manage_products',
  'manage_purchases',
  'manage_invoices',
  'view_invoices',
  'delete_invoices',
  'manage_payments',
  'view_reports',
  'view_ledger',
  'view_gst_reports',
  'manage_settings',
  'create_invoice',
  'receive_payment',
  'print_bill',
];

// Role definitions with human-readable labels
const ROLES = [
  { name: 'ADMIN',     label: 'Admin' },
  { name: 'MANAGER',   label: 'Manager' },
  { name: 'ACCOUNTANT',label: 'Accountant' },
  { name: 'SALES',     label: 'Sales' },
  { name: 'CASHIER',   label: 'Cashier' },
  { name: 'OPERATOR',  label: 'Operator' },
];

// Permissions assigned per role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'dashboard',
    'manage_users',
    'manage_customers',
    'manage_products',
    'manage_purchases',
    'manage_invoices',
    'view_invoices',
    'delete_invoices',
    'manage_payments',
    'view_reports',
    'view_ledger',
    'view_gst_reports',
    'manage_settings',
    'create_invoice',
    'receive_payment',
    'print_bill',
  ],
  MANAGER: [
    'dashboard',
    'manage_customers',
    'manage_products',
    'manage_purchases',
    'manage_invoices',
    'view_invoices',
    'manage_payments',
    'view_reports',
    'view_ledger',
  ],
  ACCOUNTANT: [
    'dashboard',
    'view_invoices',
    'manage_payments',
    'view_ledger',
    'view_gst_reports',
    'manage_customers',
    'manage_products',
    'create_invoice',
  ],
  SALES: [
    'dashboard',
    'manage_customers',
    'manage_products',
    'create_invoice',
    'view_invoices',
  ],
  CASHIER: [
    'create_invoice',
    'receive_payment',
    'print_bill',
    'view_invoices',
  ],
  OPERATOR: [
    'dashboard',
    'manage_products',
    'view_invoices',
  ],
};

// ============================================================
// SEED
// ============================================================

async function main() {
  console.log('\n================================================');
  console.log('  Viral Print Media - Database Seeding');
  console.log('================================================\n');

  // ── 1. Upsert all permissions ──────────────────────────────
  console.log('[1/5] Seeding permissions...');
  const permMap: Record<string, number> = {};
  for (const permName of ALL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { permission_name: permName },
      update: {},
      create: { permission_name: permName },
    });
    permMap[perm.permission_name] = perm.id;
  }
  console.log(`      ✓ ${ALL_PERMISSIONS.length} permissions ready`);

  // ── 2. Upsert all roles ────────────────────────────────────
  console.log('[2/5] Seeding roles...');
  const roleMap: Record<string, number> = {};
  for (const role of ROLES) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { label: role.label },
      create: { name: role.name, label: role.label },
    });
    roleMap[r.name] = r.id;
  }
  console.log(`      ✓ ${ROLES.length} roles ready`);

  // ── 3. Link permissions to roles ──────────────────────────
  console.log('[3/5] Linking permissions to roles...');
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    for (const permName of perms) {
      const permId = permMap[permName];
      if (!permId) continue;
      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: roleId, permission_id: permId } },
        update: {},
        create: { role_id: roleId, permission_id: permId },
      });
    }
    console.log(`      ✓ ${roleName} → ${perms.length} permissions`);
  }

  // ── 4. Create default company ──────────────────────────────
  console.log('[4/5] Seeding default company...');
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        company_name: 'Viral Print Media',
        gst_number: '',
        address: '',
        phone: '',
        logo: '',
      },
    });
    console.log(`      ✓ Company created: ${company.company_name}`);
  } else {
    console.log(`      ✓ Company already exists: ${company.company_name}`);
  }

  // ── 5. Create default admin user ──────────────────────────
  console.log('[5/5] Seeding default admin user...');
  const adminUsername = 'admin';
  const adminPasswordHash = hashPassword('admin123');

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        full_name: 'System Administrator',
        password_hash: adminPasswordHash,
        company_id: company.id,
        role_id: roleMap['ADMIN'],
        status: 'ACTIVE',
        created_by: null,
      },
    });
    console.log('      ✓ Admin user created');
  } else {
    // Ensure admin always has ADMIN role and ACTIVE status
    await prisma.user.update({
      where: { username: adminUsername },
      data: {
        role_id: roleMap['ADMIN'],
        status: 'ACTIVE',
        company_id: company.id,
      },
    });
    console.log('      ✓ Admin user already exists (updated role/status)');
  }

  console.log('\n================================================');
  console.log('  Seeding complete!');
  console.log('  Default login credentials:');
  console.log('    Username : admin');
  console.log('    Password : admin123');
  console.log('  Please change the admin password after first login.');
  console.log('================================================\n');
}

main()
  .catch((e) => {
    console.error('\n[ERROR] Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
