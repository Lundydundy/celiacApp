"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../lib/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all medical expenses for the authenticated user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { page = 1, limit = 50, sortBy = 'date', sortOrder = 'desc', category, year, month } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build where clause
        const where = {
            userId: req.user.id
        };
        if (category) {
            where.category = category;
        }
        // Filter by year/month if provided
        if (year) {
            const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
            const endDate = month
                ? new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
                : new Date(Number(year) + 1, 0, 0, 23, 59, 59, 999);
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }
        // Get medical expenses with pagination
        const [expenses, total] = await Promise.all([
            database_1.prisma.medicalExpense.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    description: true,
                    amount: true,
                    date: true,
                    category: true,
                    provider: true,
                    notes: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            database_1.prisma.medicalExpense.count({ where })
        ]);
        res.json(expenses);
    }
    catch (error) {
        console.error('Get medical expenses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get medical expenses'
        });
    }
});
// Get a single medical expense by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { id } = req.params;
        const expense = await database_1.prisma.medicalExpense.findFirst({
            where: {
                id,
                userId: req.user.id
            },
            select: {
                id: true,
                description: true,
                amount: true,
                date: true,
                category: true,
                provider: true,
                notes: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!expense) {
            res.status(404).json({
                success: false,
                error: 'Medical expense not found'
            });
            return;
        }
        res.json({
            success: true,
            data: expense
        });
    }
    catch (error) {
        console.error('Get medical expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get medical expense'
        });
    }
});
// Create a new medical expense
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { description, amount, date, category, provider, notes } = req.body;
        // Validation
        if (!description || amount === undefined || !date || !category) {
            res.status(400).json({
                success: false,
                error: 'Description, amount, date, and category are required'
            });
            return;
        }
        if (amount < 0) {
            res.status(400).json({
                success: false,
                error: 'Amount cannot be negative'
            });
            return;
        }
        const validCategories = ['consultation', 'medication', 'test', 'supplement', 'other'];
        if (!validCategories.includes(category)) {
            res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
            return;
        }
        const expense = await database_1.prisma.medicalExpense.create({
            data: {
                description: description.trim(),
                amount,
                date: new Date(date),
                category: category,
                provider: provider?.trim(),
                notes: notes?.trim(),
                userId: req.user.id
            },
            select: {
                id: true,
                description: true,
                amount: true,
                date: true,
                category: true,
                provider: true,
                notes: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.status(201).json({
            success: true,
            data: expense,
            message: 'Medical expense created successfully'
        });
    }
    catch (error) {
        console.error('Create medical expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create medical expense'
        });
    }
});
// Update a medical expense
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { id } = req.params;
        const { description, amount, date, category, provider, notes } = req.body;
        // Check if expense exists and belongs to user
        const existingExpense = await database_1.prisma.medicalExpense.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!existingExpense) {
            res.status(404).json({
                success: false,
                error: 'Medical expense not found'
            });
            return;
        }
        // Validation
        if (amount !== undefined && amount < 0) {
            res.status(400).json({
                success: false,
                error: 'Amount cannot be negative'
            });
            return;
        }
        if (category !== undefined) {
            const validCategories = ['consultation', 'medication', 'test', 'supplement', 'other'];
            if (!validCategories.includes(category)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid category'
                });
                return;
            }
        }
        // Build update data
        const updateData = {};
        if (description !== undefined)
            updateData.description = description.trim();
        if (amount !== undefined)
            updateData.amount = amount;
        if (date !== undefined)
            updateData.date = new Date(date);
        if (category !== undefined)
            updateData.category = category;
        if (provider !== undefined)
            updateData.provider = provider?.trim();
        if (notes !== undefined)
            updateData.notes = notes?.trim();
        const expense = await database_1.prisma.medicalExpense.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                description: true,
                amount: true,
                date: true,
                category: true,
                provider: true,
                notes: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            data: expense,
            message: 'Medical expense updated successfully'
        });
    }
    catch (error) {
        console.error('Update medical expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update medical expense'
        });
    }
});
// Delete a medical expense
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { id } = req.params;
        // Check if expense exists and belongs to user
        const existingExpense = await database_1.prisma.medicalExpense.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!existingExpense) {
            res.status(404).json({
                success: false,
                error: 'Medical expense not found'
            });
            return;
        }
        await database_1.prisma.medicalExpense.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Medical expense deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete medical expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete medical expense'
        });
    }
});
// Get medical expense categories
router.get('/categories/list', auth_1.authenticateToken, async (req, res) => {
    try {
        const categories = [
            { value: 'consultation', label: 'Medical Consultation' },
            { value: 'medication', label: 'Medication' },
            { value: 'test', label: 'Medical Test' },
            { value: 'supplement', label: 'Supplements' },
            { value: 'other', label: 'Other' }
        ];
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get categories'
        });
    }
});
// Get medical expense summary/statistics
router.get('/summary/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { year } = req.query;
        const currentYear = year ? Number(year) : new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear + 1, 0, 0, 23, 59, 59, 999);
        const expenses = await database_1.prisma.medicalExpense.findMany({
            where: {
                userId: req.user.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const count = expenses.length;
        // Category breakdown
        const categoryData = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});
        // Monthly breakdown
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const monthExpenses = expenses.filter(e => new Date(e.date).getMonth() === i);
            return {
                month: i + 1,
                count: monthExpenses.length,
                amount: monthExpenses.reduce((sum, e) => sum + e.amount, 0)
            };
        });
        res.json({
            success: true,
            data: {
                year: currentYear,
                totalAmount,
                count,
                categoryData,
                monthlyData
            }
        });
    }
    catch (error) {
        console.error('Get medical expense summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get medical expense summary'
        });
    }
});
exports.default = router;
//# sourceMappingURL=medical.js.map