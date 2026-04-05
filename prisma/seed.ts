import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 创建默认管理员用户
  const adminEmail = 'admin@example.com';
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // 生产环境请修改为强密码

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { username: adminUsername }]
    }
  });

  if (existingAdmin) {
    console.log('管理员用户已存在，跳过创建');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      }
    });

    console.log('管理员用户创建成功:', {
      id: admin.id,
      username: admin.username,
      email: admin.email
    });
    console.log('默认密码:', adminPassword);
  }

  console.log('种子数据初始化完成');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
