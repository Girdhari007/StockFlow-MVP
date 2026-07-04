"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
    }
    try {
        const token = header.split(' ')[1];
        const payload = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
}
function normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.post('/api/auth/signup', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');
        const organizationName = String(req.body?.organizationName || '').trim();
        if (!email || !password || !organizationName) {
            res.status(400).json({ message: 'Please fill in all fields.' });
            return;
        }
        if (!isValidEmail(email)) {
            res.status(400).json({ message: 'Please enter a valid email address.' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters.' });
            return;
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'An account with that email already exists.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const result = await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: organizationName },
            });
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    organizationId: organization.id,
                },
            });
            return { organization, user };
        });
        const token = jsonwebtoken_1.default.sign({ userId: result.user.id, organizationId: result.organization.id }, jwtSecret, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                organizationId: result.organization.id,
                organizationName: result.organization.name,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Signup failed. Please try again.' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');
        if (!email || !password) {
            res.status(400).json({ message: 'Please enter your email and password.' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!passwordMatches) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, organizationId: user.organizationId }, jwtSecret, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                organizationId: user.organizationId,
                organizationName: organization?.name || 'Your organization',
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user?.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                organizationId: user.organizationId,
                organizationName: organization?.name || 'Your organization',
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load account.' });
    }
});
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: 'Organization not found.' });
            return;
        }
        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        const products = await prisma.product.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });
        const defaultThreshold = organization?.defaultLowStockThreshold ?? 5;
        const lowStockItems = products
            .filter((product) => product.quantityOnHand <= (product.lowStockThreshold ?? defaultThreshold))
            .map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            quantityOnHand: product.quantityOnHand,
            lowStockThreshold: product.lowStockThreshold ?? defaultThreshold,
        }));
        res.json({
            totalProducts: products.length,
            totalQuantity: products.reduce((sum, product) => sum + product.quantityOnHand, 0),
            lowStockItems,
            defaultThreshold,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load dashboard.' });
    }
});
app.get('/api/products', authMiddleware, async (req, res) => {
    try {
        const search = String(req.query.search || '').trim();
        const organizationId = req.user?.organizationId;
        const products = await prisma.product.findMany({
            where: {
                organizationId,
                OR: search
                    ? [
                        { name: { contains: search } },
                        { sku: { contains: search } },
                    ]
                    : undefined,
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load products.' });
    }
});
app.post('/api/products', authMiddleware, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const name = String(req.body?.name || '').trim();
        const sku = String(req.body?.sku || '').trim().toUpperCase();
        if (!name || !sku) {
            res.status(400).json({ message: 'Please enter a name and SKU.' });
            return;
        }
        const quantityOnHand = normalizeNumber(req.body?.quantityOnHand);
        const costPrice = normalizeNumber(req.body?.costPrice);
        const sellingPrice = normalizeNumber(req.body?.sellingPrice);
        const lowStockThreshold = normalizeNumber(req.body?.lowStockThreshold);
        if (quantityOnHand === null || !Number.isInteger(quantityOnHand)) {
            res.status(400).json({ message: 'Quantity must be a whole number.' });
            return;
        }
        const product = await prisma.product.create({
            data: {
                organizationId: organizationId || '',
                name,
                sku,
                description: req.body?.description ? String(req.body.description).trim() : null,
                quantityOnHand,
                costPrice: costPrice === null ? null : costPrice,
                sellingPrice: sellingPrice === null ? null : sellingPrice,
                lowStockThreshold: lowStockThreshold === null ? null : lowStockThreshold,
                lastUpdatedBy: req.user?.userId,
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to create product.' });
    }
});
app.put('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const productId = req.params.id;
        const name = String(req.body?.name || '').trim();
        const sku = String(req.body?.sku || '').trim().toUpperCase();
        if (!name || !sku) {
            res.status(400).json({ message: 'Please enter a name and SKU.' });
            return;
        }
        const quantityOnHand = normalizeNumber(req.body?.quantityOnHand);
        const costPrice = normalizeNumber(req.body?.costPrice);
        const sellingPrice = normalizeNumber(req.body?.sellingPrice);
        const lowStockThreshold = normalizeNumber(req.body?.lowStockThreshold);
        if (quantityOnHand === null || !Number.isInteger(quantityOnHand)) {
            res.status(400).json({ message: 'Quantity must be a whole number.' });
            return;
        }
        const existing = await prisma.product.findFirst({ where: { id: productId, organizationId } });
        if (!existing) {
            res.status(404).json({ message: 'Product not found.' });
            return;
        }
        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                sku,
                description: req.body?.description ? String(req.body.description).trim() : null,
                quantityOnHand,
                costPrice: costPrice === null ? null : costPrice,
                sellingPrice: sellingPrice === null ? null : sellingPrice,
                lowStockThreshold: lowStockThreshold === null ? null : lowStockThreshold,
                lastUpdatedBy: req.user?.userId,
            },
        });
        res.json(product);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to update product.' });
    }
});
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const productId = req.params.id;
        const existing = await prisma.product.findFirst({ where: { id: productId, organizationId } });
        if (!existing) {
            res.status(404).json({ message: 'Product not found.' });
            return;
        }
        await prisma.product.delete({ where: { id: productId } });
        res.json({ message: 'Product deleted.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to delete product.' });
    }
});
app.get('/api/settings', authMiddleware, async (req, res) => {
    try {
        const organization = await prisma.organization.findUnique({ where: { id: req.user?.organizationId } });
        res.json({ defaultLowStockThreshold: organization?.defaultLowStockThreshold ?? 5 });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load settings.' });
    }
});
app.put('/api/settings', authMiddleware, async (req, res) => {
    try {
        const threshold = normalizeNumber(req.body?.defaultLowStockThreshold);
        if (threshold === null || !Number.isInteger(threshold) || threshold < 0) {
            res.status(400).json({ message: 'Threshold must be a whole number of 0 or more.' });
            return;
        }
        const organization = await prisma.organization.update({
            where: { id: req.user?.organizationId },
            data: { defaultLowStockThreshold: threshold },
        });
        res.json({ defaultLowStockThreshold: organization.defaultLowStockThreshold });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to update settings.' });
    }
});
app.listen(port, () => {
    console.log(`StockFlow MVP backend listening on port ${port}`);
});
//# sourceMappingURL=server.js.map