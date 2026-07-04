const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({});
  await prisma.$connect();
  console.log('connected');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
