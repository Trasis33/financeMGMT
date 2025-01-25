"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const index_1 = require("../index");
const getUsers = async (req, res, next) => {
    try {
        const users = await index_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json(users);
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
