var _a;
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis;
export const prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new PrismaClient({
    log: ['query', 'error', 'warn'],
});
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
// Connection helper
export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
// Graceful shutdown
export const disconnectDatabase = async () => {
    try {
        await prisma.$disconnect();
        console.log('✅ Database disconnected successfully');
    }
    catch (error) {
        console.error('❌ Database disconnection failed:', error);
    }
};
export default prisma;
