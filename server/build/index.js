"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const auth_1 = __importDefault(require("./routes/auth"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const splitExpenses_1 = __importDefault(require("./routes/splitExpenses"));
const users_1 = __importDefault(require("./routes/users"));
dotenv_1.default.config();
// Validate required environment variables
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in environment variables');
}
if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required in environment variables');
}
const app = (0, express_1.default)();
exports.prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error']
});
// CORS configuration with preflight support
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Authorization', 'Set-Cookie'],
    maxAge: 86400 // 24 hours in seconds
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Pre-flight requests
app.options('*', (0, cors_1.default)(corsOptions));
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/split-expenses', splitExpenses_1.default);
app.use('/api/users', users_1.default);
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                res.status(409).json({
                    message: 'A resource with that unique constraint already exists'
                });
                return;
            case 'P2025':
                res.status(404).json({
                    message: 'Record not found'
                });
                return;
            default:
                break;
        }
    }
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
};
app.use(errorHandler);
const PORT = process.env.PORT || 3333;
async function main() {
    try {
        await exports.prisma.$connect();
        console.log('Connected to database');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}
// Proper cleanup on shutdown
const cleanup = async () => {
    console.log('Closing HTTP server and database connection...');
    await exports.prisma.$disconnect();
    process.exit(0);
};
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
main().catch((error) => {
    console.error('Startup error:', error);
    process.exit(1);
});
