"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const billInclude = {
    creator: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    participants: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    },
    payments: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    },
};
exports.billsController = {
    async createBill(req, res) {
        var _a;
        try {
            const { description, amount, dueDate, isRecurring, recurringPeriod, category, notes, participants } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Validate total share equals 100%
            const totalShare = participants.reduce((sum, p) => sum + p.share, 0);
            if (Math.abs(totalShare - 1) > 0.0001) {
                return res.status(400).json({ error: 'Total share must equal 100%' });
            }
            const bill = await prisma.bill.create({
                data: {
                    description,
                    amount,
                    dueDate: new Date(dueDate),
                    isRecurring,
                    recurringPeriod,
                    category,
                    notes,
                    creatorId: userId,
                    participants: {
                        create: participants.map((p) => ({
                            userId: p.userId,
                            share: p.share,
                        })),
                    },
                },
                include: billInclude,
            });
            // Include new token in response if one was generated
            if (res.locals.newToken) {
                res.json({
                    data: bill,
                    token: res.locals.newToken
                });
            }
            else {
                res.json(bill);
            }
        }
        catch (error) {
            console.error('Error creating bill:', error);
            res.status(500).json({ error: 'Failed to create bill' });
        }
    },
    async getBills(req, res) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { startDate, endDate, category, isRecurring, isPaid } = req.query;
            // Build filter conditions
            const where = Object.assign(Object.assign(Object.assign({ OR: [
                    { creatorId: userId },
                    {
                        participants: {
                            some: {
                                userId,
                            },
                        },
                    },
                ] }, (startDate && endDate
                ? {
                    dueDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }
                : {})), (category ? { category } : {})), (isRecurring !== undefined ? { isRecurring } : {}));
            const bills = await prisma.bill.findMany({
                where,
                include: billInclude,
                orderBy: {
                    dueDate: 'asc',
                },
            });
            // Filter by payment status if requested
            const filteredBills = isPaid !== undefined
                ? bills.filter((bill) => {
                    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                    const isPaidBill = Math.abs(totalPaid - bill.amount) < 0.01;
                    return isPaid ? isPaidBill : !isPaidBill;
                })
                : bills;
            // Include new token in response if one was generated
            if (res.locals.newToken) {
                res.json({
                    data: filteredBills,
                    token: res.locals.newToken
                });
            }
            else {
                res.json(filteredBills);
            }
        }
        catch (error) {
            console.error('Error fetching bills:', error);
            res.status(500).json({ error: 'Failed to fetch bills' });
        }
    },
    async getBill(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const bill = await prisma.bill.findFirst({
                where: {
                    id: parseInt(id),
                    OR: [
                        { creatorId: userId },
                        {
                            participants: {
                                some: {
                                    userId,
                                },
                            },
                        },
                    ],
                },
                include: billInclude,
            });
            if (!bill) {
                return res.status(404).json({ error: 'Bill not found' });
            }
            // Include new token in response if one was generated
            if (res.locals.newToken) {
                res.json({
                    data: bill,
                    token: res.locals.newToken
                });
            }
            else {
                res.json(bill);
            }
        }
        catch (error) {
            console.error('Error fetching bill:', error);
            res.status(500).json({ error: 'Failed to fetch bill' });
        }
    },
    async updateBill(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const updates = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Verify bill exists and user is creator
            const existingBill = await prisma.bill.findFirst({
                where: {
                    id: parseInt(id),
                    creatorId: userId,
                },
            });
            if (!existingBill) {
                return res.status(404).json({ error: 'Bill not found or unauthorized' });
            }
            // If updating participants, validate total share
            if (updates.participants) {
                const totalShare = updates.participants.reduce((sum, p) => sum + p.share, 0);
                if (Math.abs(totalShare - 1) > 0.0001) {
                    return res.status(400).json({ error: 'Total share must equal 100%' });
                }
            }
            // Update bill and participants if provided
            const bill = await prisma.bill.update({
                where: { id: parseInt(id) },
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (updates.description && { description: updates.description })), (updates.amount && { amount: updates.amount })), (updates.dueDate && { dueDate: new Date(updates.dueDate) })), (updates.isRecurring !== undefined && { isRecurring: updates.isRecurring })), (updates.recurringPeriod && { recurringPeriod: updates.recurringPeriod })), (updates.category && { category: updates.category })), (updates.notes !== undefined && { notes: updates.notes })), (updates.participants && {
                    participants: {
                        deleteMany: {},
                        create: updates.participants.map((p) => ({
                            userId: p.userId,
                            share: p.share,
                        })),
                    },
                })),
                include: billInclude,
            });
            // Include new token in response if one was generated
            if (res.locals.newToken) {
                res.json({
                    data: bill,
                    token: res.locals.newToken
                });
            }
            else {
                res.json(bill);
            }
        }
        catch (error) {
            console.error('Error updating bill:', error);
            res.status(500).json({ error: 'Failed to update bill' });
        }
    },
    async deleteBill(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Verify bill exists and user is creator
            const existingBill = await prisma.bill.findFirst({
                where: {
                    id: parseInt(id),
                    creatorId: userId,
                },
            });
            if (!existingBill) {
                return res.status(404).json({ error: 'Bill not found or unauthorized' });
            }
            await prisma.bill.delete({
                where: { id: parseInt(id) },
            });
            res.json({ message: 'Bill deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting bill:', error);
            res.status(500).json({ error: 'Failed to delete bill' });
        }
    },
    async addPayment(req, res) {
        var _a;
        try {
            const { billId } = req.params;
            const { amount, notes } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Verify bill exists and user is participant
            const bill = await prisma.bill.findFirst({
                where: {
                    id: parseInt(billId),
                    participants: {
                        some: {
                            userId,
                        },
                    },
                },
                include: {
                    payments: true,
                },
            });
            if (!bill) {
                return res.status(404).json({ error: 'Bill not found or unauthorized' });
            }
            // Calculate total paid amount including new payment
            const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
            if (totalPaid > bill.amount) {
                return res.status(400).json({ error: 'Total payments cannot exceed bill amount' });
            }
            const payment = await prisma.billPayment.create({
                data: {
                    billId: parseInt(billId),
                    userId,
                    amount,
                    notes,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            // Include new token in response if one was generated
            if (res.locals.newToken) {
                res.json({
                    data: payment,
                    token: res.locals.newToken
                });
            }
            else {
                res.json(payment);
            }
        }
        catch (error) {
            console.error('Error adding payment:', error);
            res.status(500).json({ error: 'Failed to add payment' });
        }
    },
    async getBillStatistics(req, res) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const bills = await prisma.bill.findMany({
                where: {
                    OR: [
                        { creatorId: userId },
                        {
                            participants: {
                                some: {
                                    userId,
                                },
                            },
                        },
                    ],
                },
                include: {
                    payments: true,
                },
            });
            const now = new Date();
            const statistics = {
                totalAmount: 0,
                paidAmount: 0,
                unpaidAmount: 0,
                overdueBills: 0,
                upcomingBills: 0,
                billsByCategory: {},
            };
            bills.forEach((bill) => {
                statistics.totalAmount += bill.amount;
                const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                statistics.paidAmount += totalPaid;
                statistics.unpaidAmount += bill.amount - totalPaid;
                if (bill.dueDate < now && totalPaid < bill.amount) {
                    statistics.overdueBills++;
                }
                if (bill.dueDate > now && totalPaid < bill.amount) {
                    statistics.upcomingBills++;
                }
                statistics.billsByCategory[bill.category] = (statistics.billsByCategory[bill.category] || 0) + 1;
            });
            // Include new token in response if one was generated
            if (res.locals.newToken) {
                res.json({
                    data: statistics,
                    token: res.locals.newToken
                });
            }
            else {
                res.json(statistics);
            }
        }
        catch (error) {
            console.error('Error fetching bill statistics:', error);
            res.status(500).json({ error: 'Failed to fetch bill statistics' });
        }
    },
};
