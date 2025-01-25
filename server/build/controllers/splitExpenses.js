"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalances = exports.deleteSplitExpense = exports.updateSplitExpense = exports.createSplitExpense = exports.getSplitExpense = exports.getSplitExpenses = void 0;
const index_1 = require("../index");
const getSplitExpenses = async (req, res, next) => {
    try {
        const userId = req.userId;
        const expenses = await index_1.prisma.splitExpense.findMany({
            where: {
                participants: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                creator: true,
                paidBy: true
            },
            orderBy: { date: 'desc' }
        });
        res.json({ expenses });
    }
    catch (error) {
        next(error);
    }
};
exports.getSplitExpenses = getSplitExpenses;
const getSplitExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const expense = await index_1.prisma.splitExpense.findFirst({
            where: {
                id: parseInt(id),
                participants: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                creator: true,
                paidBy: true
            }
        });
        if (!expense) {
            res.status(404).json({ message: 'Split expense not found' });
            return;
        }
        res.json({ expense });
    }
    catch (error) {
        next(error);
    }
};
exports.getSplitExpense = getSplitExpense;
const createSplitExpense = async (req, res, next) => {
    try {
        const { description, amount, date, participantIds, shares, paidById } = req.body;
        const creatorId = req.userId;
        if (!creatorId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Validate participants
        const uniqueParticipantIds = [...new Set([...participantIds, creatorId])];
        const participants = await index_1.prisma.user.findMany({
            where: {
                id: {
                    in: uniqueParticipantIds
                }
            }
        });
        if (participants.length !== uniqueParticipantIds.length) {
            res.status(400).json({ message: 'One or more participants not found' });
            return;
        }
        // Validate payer exists and is a participant
        if (!uniqueParticipantIds.includes(paidById)) {
            res.status(400).json({ message: 'Payer must be a participant in the expense' });
            return;
        }
        // Calculate shares
        const defaultShare = 1 / uniqueParticipantIds.length;
        const participantShares = uniqueParticipantIds.reduce((acc, userId) => {
            var _a;
            acc[userId] = (_a = shares === null || shares === void 0 ? void 0 : shares[userId]) !== null && _a !== void 0 ? _a : defaultShare;
            return acc;
        }, {});
        // Validate shares sum to 1
        const shareSum = Object.values(participantShares).reduce((sum, share) => sum + share, 0);
        if (Math.abs(shareSum - 1) > 0.0001) {
            res.status(400).json({ message: 'Share proportions must sum to 1' });
            return;
        }
        // Create split expense with participants
        const splitExpense = await index_1.prisma.splitExpense.create({
            data: {
                description,
                amount,
                date: new Date(date),
                creatorId,
                paidById,
                participants: {
                    create: uniqueParticipantIds.map(userId => ({
                        userId,
                        share: participantShares[userId]
                    }))
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                creator: true,
                paidBy: true
            }
        });
        res.status(201).json({ expense: splitExpense });
    }
    catch (error) {
        next(error);
    }
};
exports.createSplitExpense = createSplitExpense;
const updateSplitExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { description, amount, date, participantIds, shares, paidById } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Check if expense exists and user is creator
        const existingExpense = await index_1.prisma.splitExpense.findFirst({
            where: {
                id: parseInt(id),
                creatorId: userId
            },
            include: {
                participants: true
            }
        });
        if (!existingExpense) {
            res.status(404).json({ message: 'Split expense not found or unauthorized' });
            return;
        }
        // Prepare update data
        const updateData = Object.assign(Object.assign(Object.assign(Object.assign({}, (description && { description })), (amount && { amount })), (date && { date: new Date(date) })), (paidById && { paidById }));
        // Update participants if provided
        if (participantIds) {
            const uniqueParticipantIds = [...new Set([...participantIds, userId])];
            // Validate participants exist
            const participants = await index_1.prisma.user.findMany({
                where: {
                    id: {
                        in: uniqueParticipantIds
                    }
                }
            });
            if (participants.length !== uniqueParticipantIds.length) {
                res.status(400).json({ message: 'One or more participants not found' });
                return;
            }
            // If paidById is being updated, validate they're a participant
            if (paidById && !uniqueParticipantIds.includes(paidById)) {
                res.status(400).json({ message: 'Payer must be a participant in the expense' });
                return;
            }
            // Calculate shares
            const defaultShare = 1 / uniqueParticipantIds.length;
            const participantShares = uniqueParticipantIds.reduce((acc, pId) => {
                var _a;
                acc[pId] = (_a = shares === null || shares === void 0 ? void 0 : shares[pId]) !== null && _a !== void 0 ? _a : defaultShare;
                return acc;
            }, {});
            // Validate shares sum to 1
            const shareSum = Object.values(participantShares).reduce((sum, share) => sum + share, 0);
            if (Math.abs(shareSum - 1) > 0.0001) {
                res.status(400).json({ message: 'Share proportions must sum to 1' });
                return;
            }
            // Update participants
            await index_1.prisma.splitExpenseParticipant.deleteMany({
                where: { splitExpenseId: parseInt(id) }
            });
            updateData.participants = {
                create: uniqueParticipantIds.map(pId => ({
                    userId: pId,
                    share: participantShares[pId]
                }))
            };
        }
        // Update expense
        const updatedExpense = await index_1.prisma.splitExpense.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                creator: true,
                paidBy: true
            }
        });
        res.json({ expense: updatedExpense });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSplitExpense = updateSplitExpense;
const deleteSplitExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Check if expense exists and user is creator
        const expense = await index_1.prisma.splitExpense.findFirst({
            where: {
                id: parseInt(id),
                creatorId: userId
            }
        });
        if (!expense) {
            res.status(404).json({ message: 'Split expense not found or unauthorized' });
            return;
        }
        // Delete expense and all related participants
        await index_1.prisma.splitExpense.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSplitExpense = deleteSplitExpense;
const getBalances = async (req, res, next) => {
    try {
        const userId = req.userId;
        const expenses = await index_1.prisma.splitExpense.findMany({
            where: {
                participants: {
                    some: {
                        userId
                    }
                }
            },
            select: {
                id: true,
                amount: true,
                paidById: true,
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // Calculate balances
        const balances = new Map();
        // Initialize balances for all users involved in expenses
        expenses.forEach((expense) => {
            expense.participants.forEach((participant) => {
                const { id: userId, name: userName } = participant.user;
                if (!balances.has(userId)) {
                    balances.set(userId, {
                        userId,
                        userName,
                        netBalance: 0,
                        owes: [],
                        isOwed: []
                    });
                }
            });
        });
        // Calculate amounts owed/owing
        expenses.forEach((expense) => {
            const paidByUserId = expense.paidById;
            const totalAmount = expense.amount;
            expense.participants.forEach((participant) => {
                const participantShare = totalAmount * participant.share;
                const participantUserId = participant.userId;
                if (participantUserId !== paidByUserId) {
                    // Update the participant's balance (they owe the payer)
                    const participantBalance = balances.get(participantUserId);
                    participantBalance.netBalance -= participantShare;
                    // Update the payer's balance (they are owed by the participant)
                    const payerBalance = balances.get(paidByUserId);
                    payerBalance.netBalance += participantShare;
                    // Record the debt relationship
                    participantBalance.owes.push({
                        userId: paidByUserId,
                        userName: balances.get(paidByUserId).userName,
                        amount: participantShare
                    });
                    payerBalance.isOwed.push({
                        userId: participantUserId,
                        userName: participantBalance.userName,
                        amount: participantShare
                    });
                }
            });
        });
        // Convert Map to array and round numbers
        const balanceArray = Array.from(balances.values()).map(balance => (Object.assign(Object.assign({}, balance), { netBalance: Math.round(balance.netBalance * 100) / 100, owes: balance.owes.map(debt => (Object.assign(Object.assign({}, debt), { amount: Math.round(debt.amount * 100) / 100 }))), isOwed: balance.isOwed.map(credit => (Object.assign(Object.assign({}, credit), { amount: Math.round(credit.amount * 100) / 100 }))) })));
        res.json(balanceArray);
    }
    catch (error) {
        next(error);
    }
};
exports.getBalances = getBalances;
