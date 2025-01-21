"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSplitExpense = exports.updateSplitExpense = exports.createSplitExpense = exports.getSplitExpense = exports.getSplitExpenses = void 0;
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
                creator: {
                    select: { id: true, name: true, email: true }
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
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
                creator: {
                    select: { id: true, name: true, email: true }
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
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
        const { description, amount, date, participantIds, shares } = req.body;
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
                participants: {
                    create: uniqueParticipantIds.map(userId => ({
                        userId,
                        share: participantShares[userId]
                    }))
                }
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true }
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
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
        const { description, amount, date, participantIds, shares } = req.body;
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
        const updateData = Object.assign(Object.assign(Object.assign({}, (description && { description })), (amount && { amount })), (date && { date: new Date(date) }));
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
                creator: {
                    select: { id: true, name: true, email: true }
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
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
