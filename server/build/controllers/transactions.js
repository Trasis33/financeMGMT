"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransaction = exports.getMonthlyReports = exports.getTransactions = void 0;
const index_1 = require("../index");
// Get all transactions
const getTransactions = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const userId = req.userId;
        const transactions = await index_1.prisma.transaction.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: limit,
        });
        res.json({ transactions });
    }
    catch (error) {
        next(error);
    }
};
exports.getTransactions = getTransactions;
// Get monthly reports
const getMonthlyReports = async (req, res, next) => {
    try {
        const userId = req.userId;
        const currentYear = new Date().getFullYear();
        const transactions = await index_1.prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(currentYear, 0, 1),
                    lte: new Date(),
                },
            },
            orderBy: { date: 'asc' },
        });
        const monthlyReports = new Array(12).fill(null).map((_, index) => {
            const monthTransactions = transactions.filter(t => new Date(t.date).getMonth() === index);
            const income = monthTransactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTransactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + t.amount, 0);
            return {
                month: new Date(currentYear, index).toLocaleString('default', { month: 'long' }),
                income,
                expenses,
                balance: income - expenses,
            };
        });
        const currentMonth = new Date().getMonth();
        const reports = monthlyReports.slice(0, currentMonth + 1);
        res.json({ reports });
    }
    catch (error) {
        next(error);
    }
};
exports.getMonthlyReports = getMonthlyReports;
// Get single transaction
const getTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const transaction = await index_1.prisma.transaction.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });
        if (!transaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        res.json({ transaction });
    }
    catch (error) {
        next(error);
    }
};
exports.getTransaction = getTransaction;
// Create transaction
const createTransaction = async (req, res, next) => {
    try {
        const { date, description, amount, type, category } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const transaction = await index_1.prisma.transaction.create({
            data: {
                date: new Date(date),
                description,
                amount,
                type,
                category,
                userId
            },
        });
        res.status(201).json({ transaction });
    }
    catch (error) {
        next(error);
    }
};
exports.createTransaction = createTransaction;
// Update transaction
const updateTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, description, amount, type, category } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const existingTransaction = await index_1.prisma.transaction.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });
        if (!existingTransaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        const updatedTransaction = await index_1.prisma.transaction.update({
            where: { id: parseInt(id) },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (date && { date: new Date(date) })), (description && { description })), (amount && { amount })), (type && { type })), (category && { category })),
        });
        res.json({ transaction: updatedTransaction });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTransaction = updateTransaction;
// Delete transaction
const deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const transaction = await index_1.prisma.transaction.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });
        if (!transaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        await index_1.prisma.transaction.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTransaction = deleteTransaction;
