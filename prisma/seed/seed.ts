// typescript

import axios from 'axios';
import * as bcrypt from 'bcrypt';
import {
  DistrictResponse,
  IGhnResponse,
  ProvinceResponse,
  WardResponse,
} from 'src/modules/ghn/dto/ghn.response.dto';
import { prisma } from 'src/utils/prisma';

const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;
const GHN_BASE_URL =
  process.env.GHN_BASE_URL ||
  'https://dev-online-gateway.ghn.vn/shiip/public-api';

async function main() {
  console.log('--- Đang lấy dữ liệu Tỉnh/Thành từ GHN... ---');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  await seedProvinces();

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log('Admin already exists');
    return;
  }

  let adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN' },
    });
    await prisma.role.create({
      data: { name: 'USER' },
    });
    await prisma.role.create({
      data: { name: 'STAFF' },
    });
    console.log('Admin, User, and Staff roles created');
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hash,
      name: 'System Administrator',
      roleId: adminRole.id,
    },
  });

  console.log('Admin user created');
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
