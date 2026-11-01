// typescript

import axios from 'axios';
import * as bcrypt from 'bcrypt';
import {
  DistrictResponse,
  IGhnResponse,
  ProvinceResponse,
  WardResponse,
} from 'src/modules/ghn/dto/ghn.response.dto';
import { SYSTEM_PERMISSIONS } from 'src/modules/permissions/permissions.enum';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from 'generated/prisma/client';
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;
const GHN_BASE_URL =
  process.env.GHN_BASE_URL ||
  'https://dev-online-gateway.ghn.vn/shiip/public-api';

async function main() {
  console.log('--- 1. Đồng bộ danh mục Permissions hệ thống ---');
  await seedPermissionsAndRoles();

  console.log('--- 2. Lấy dữ liệu Tỉnh/Thành từ GHN... ---');
  try {
    await seedProvinces();
  } catch (error) {
    console.warn('Bỏ qua seed GHN do không có cấu hình mạng hoặc token GHN:', (error as Error).message);
  }
}

async function seedPermissionsAndRoles() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  // 1. Upsert toàn bộ permissions
  console.log(`Đang nạp ${SYSTEM_PERMISSIONS.length} permissions...`);
  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        description: perm.description,
        module: perm.module,
      },
      create: {
        name: perm.name,
        description: perm.description,
        module: perm.module,
      },
    });
  }
  console.log(`✅ Đã nạp thành công ${SYSTEM_PERMISSIONS.length} permissions.`);

  // 2. Tạo các Role mặc định
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN' },
  });

  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: { name: 'STAFF' },
  });

  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  // 3. Gán FULL quyền cho SUPER_ADMIN và ADMIN
  const allDbPermissions = await prisma.permission.findMany({ select: { id: true } });
  const targetRoleIds = [superAdminRole.id];

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    targetRoleIds.push(adminRole.id);
  }

  for (const roleId of targetRoleIds) {
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });
    await prisma.rolePermission.createMany({
      data: allDbPermissions.map((p) => ({
        roleId,
        permissionId: p.id,
      })),
    });
  }
  console.log(`✅ Đã gán FULL ${allDbPermissions.length} quyền cho SUPER_ADMIN và ADMIN.`);

  // 4. Tạo hoặc cập nhật tài khoản Super Admin
  const hash = await bcrypt.hash(adminPassword, 10);
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        roleId: superAdminRole.id,
      },
    });
    console.log(`✅ Đã cập nhật tài khoản Admin ${adminEmail} sang role SUPER_ADMIN (Full quyền).`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hash,
        name: 'System Super Administrator',
        roleId: superAdminRole.id,
      },
    });
    console.log(`✅ Đã tạo mới tài khoản Super Admin ${adminEmail} (Full quyền).`);
  }
}

async function seedProvinces() {
  console.log('--- Đang lấy dữ liệu Tỉnh/Thành từ GHN... ---');

  const responseProvince = await axios.get<IGhnResponse<ProvinceResponse[]>>(
    `${GHN_BASE_URL}/master-data/province`,
    {
      headers: {
        ShopId: GHN_SHOP_ID,
        Token: GHN_TOKEN,
      },
    },
  );

  const provinces = responseProvince.data.data;

  for (const p of provinces) {
    await prisma.province.upsert({
      where: { id: p.ProvinceID },
      update: { name: p.ProvinceName },
      create: {
        id: p.ProvinceID,
        name: p.ProvinceName,
      },
    });
  }
  console.log(`✅ Đã xong ${provinces.length} Tỉnh/Thành.`);

  const responseDistrict = await axios.get<IGhnResponse<DistrictResponse[]>>(
    `${GHN_BASE_URL}/master-data/district`,
    {
      headers: {
        Token: GHN_TOKEN,
        ShopId: GHN_SHOP_ID,
      },
    },
  );

  const districts = responseDistrict.data.data;

  for (const d of districts) {
    // Kiểm tra xem tỉnh này có trong DB chưa để tránh lỗi Foreign Key
    const provinceExists = await prisma.province.findUnique({
      where: { id: d.ProvinceID },
    });

    if (provinceExists) {
      await prisma.district.upsert({
        where: { id: d.DistrictID },
        update: { name: d.DistrictName },
        create: {
          id: d.DistrictID,
          name: d.DistrictName,
          provinceId: d.ProvinceID, // Khóa ngoại phải khớp với id trong bảng Province
        },
      });
    } else {
      console.warn(
        `Bỏ qua Quận ${d.DistrictName} vì Tỉnh ID ${d.ProvinceID} không tồn tại!`,
      );
    }
  }
  console.log(`✅ Đã xong ${districts.length} Quận/Huyện.`);
  // bỏ không lấy thông tin phường xác vì có quá nhiều kh tể import vào database đc
  console.log('--- Bỏ qua import Phường/Xã do có quá nhiều dữ liệu... ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
