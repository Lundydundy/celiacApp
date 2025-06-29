"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../lib/database");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Get all receipts for the authenticated user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { page = 1, limit = 50, sortBy = 'receiptDate', sortOrder = 'desc', year, month } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build where clause
        const where = {
            userId: req.user.id
        }; // Filter by year/month if provided
        if (year) {
            const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
            const endDate = month
                ? new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
                : new Date(Number(year) + 1, 0, 0, 23, 59, 59, 999);
            where.receiptDate = {
                gte: startDate,
                lte: endDate
            };
        }
        // Get receipts with items
        const [receipts, total] = await Promise.all([
            database_1.prisma.receipt.findMany({
                where,
                include: {
                    items: {
                        include: {
                            purchasedProduct: {
                                select: {
                                    id: true,
                                    name: true,
                                    brand: true,
                                    category: true,
                                    price: true
                                }
                            },
                            comparisonProduct: {
                                select: {
                                    id: true,
                                    name: true,
                                    brand: true,
                                    category: true,
                                    price: true
                                }
                            }
                        }
                    }
                },
                skip,
                take,
                orderBy: { [sortBy]: sortOrder }
            }),
            database_1.prisma.receipt.count({ where })
        ]);
        res.json(receipts);
    }
    catch (error) {
        console.error('Get receipts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get receipts'
        });
    }
});
// Get a single receipt by ID
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
        const receipt = await database_1.prisma.receipt.findFirst({
            where: {
                id,
                userId: req.user.id
            }, include: {
                items: true
            }
        });
        if (!receipt) {
            res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
            return;
        }
        res.json({
            success: true,
            data: receipt
        });
    }
    catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get receipt'
        });
    }
});
// Create a new receipt
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { storeName, receiptDate, totalAmount, eligibleAmount, imageUrl, imageFileName, imageMimeType, imageSize, items } = req.body;
        // Validation
        if (!storeName || !receiptDate || totalAmount === undefined || eligibleAmount === undefined) {
            res.status(400).json({
                success: false,
                error: 'Store name, receipt date, total amount, and eligible amount are required'
            });
            return;
        }
        if (totalAmount < 0 || eligibleAmount < 0) {
            res.status(400).json({
                success: false,
                error: 'Amounts cannot be negative'
            });
            return;
        }
        if (eligibleAmount > totalAmount) {
            res.status(400).json({
                success: false,
                error: 'Eligible amount cannot exceed total amount'
            });
            return;
        } // Validate items if provided
        if (items && items.length > 0) {
            for (const item of items) {
                if (!item.name || item.price === undefined) {
                    res.status(400).json({
                        success: false,
                        error: 'Each item must have a name and price'
                    });
                    return;
                }
                if (item.price < 0) {
                    res.status(400).json({
                        success: false,
                        error: 'Item prices cannot be negative'
                    });
                    return;
                }
                if (item.comparisonPrice !== undefined && item.comparisonPrice < 0) {
                    res.status(400).json({
                        success: false,
                        error: 'Comparison prices cannot be negative'
                    });
                    return;
                }
            }
        }
        const receipt = await database_1.prisma.receipt.create({
            data: {
                storeName: storeName.trim(),
                receiptDate: new Date(receiptDate),
                totalAmount,
                eligibleAmount,
                imageUrl: imageUrl?.trim(),
                imageFileName: imageFileName?.trim(),
                imageMimeType: imageMimeType?.trim(),
                imageSize,
                userId: req.user.id, items: {
                    create: items?.map(item => {
                        // Calculate incremental cost if comparison price is provided
                        const incrementalCost = item.comparisonPrice !== undefined
                            ? item.price - item.comparisonPrice
                            : undefined;
                        return {
                            name: item.name.trim(),
                            price: item.price,
                            quantity: item.quantity || 1,
                            isEligible: item.isEligible ?? true,
                            purchasedProductId: item.purchasedProductId || undefined,
                            comparisonProductId: item.comparisonProductId || undefined,
                            comparisonPrice: item.comparisonPrice,
                            incrementalCost
                        };
                    }) || []
                }
            },
            include: {
                items: {
                    include: {
                        purchasedProduct: {
                            select: {
                                id: true,
                                name: true,
                                brand: true,
                                category: true,
                                price: true
                            }
                        },
                        comparisonProduct: {
                            select: {
                                id: true,
                                name: true,
                                brand: true,
                                category: true,
                                price: true
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: receipt,
            message: 'Receipt created successfully'
        });
    }
    catch (error) {
        console.error('Create receipt error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create receipt'
        });
    }
});
// Update a receipt
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
        const { storeName, receiptDate, totalAmount, eligibleAmount, imageUrl, imageFileName, imageMimeType, imageSize, items } = req.body;
        // Check if receipt exists and belongs to user
        const existingReceipt = await database_1.prisma.receipt.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!existingReceipt) {
            res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
            return;
        }
        // Validation
        if (totalAmount !== undefined && totalAmount < 0) {
            res.status(400).json({
                success: false,
                error: 'Total amount cannot be negative'
            });
            return;
        }
        if (eligibleAmount !== undefined && eligibleAmount < 0) {
            res.status(400).json({
                success: false,
                error: 'Eligible amount cannot be negative'
            });
            return;
        }
        if (totalAmount !== undefined && eligibleAmount !== undefined && eligibleAmount > totalAmount) {
            res.status(400).json({
                success: false,
                error: 'Eligible amount cannot exceed total amount'
            });
            return;
        }
        // Build update data
        const updateData = {};
        if (storeName !== undefined)
            updateData.storeName = storeName.trim();
        if (receiptDate !== undefined)
            updateData.receiptDate = new Date(receiptDate);
        if (totalAmount !== undefined)
            updateData.totalAmount = totalAmount;
        if (eligibleAmount !== undefined)
            updateData.eligibleAmount = eligibleAmount;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl?.trim();
        if (imageFileName !== undefined)
            updateData.imageFileName = imageFileName?.trim();
        if (imageMimeType !== undefined)
            updateData.imageMimeType = imageMimeType?.trim();
        if (imageSize !== undefined)
            updateData.imageSize = imageSize;
        // Update receipt and items in transaction
        const receipt = await database_1.prisma.$transaction(async (tx) => {
            // Update receipt
            const updatedReceipt = await tx.receipt.update({
                where: { id },
                data: updateData
            }); // Update items if provided
            if (items) {
                // Delete existing items
                await tx.receiptItem.deleteMany({
                    where: { receiptId: id }
                });
                // Create new items
                if (items.length > 0) {
                    await tx.receiptItem.createMany({
                        data: items.map(item => {
                            // Calculate incremental cost if comparison price is provided
                            const incrementalCost = item.comparisonPrice !== undefined
                                ? item.price - item.comparisonPrice
                                : undefined;
                            return {
                                receiptId: id,
                                name: item.name.trim(),
                                price: item.price,
                                quantity: item.quantity || 1,
                                isEligible: item.isEligible ?? true,
                                purchasedProductId: item.purchasedProductId || undefined,
                                comparisonProductId: item.comparisonProductId || undefined,
                                comparisonPrice: item.comparisonPrice,
                                incrementalCost
                            };
                        })
                    });
                }
            }
            // Return receipt with items
            return tx.receipt.findUnique({
                where: { id },
                include: {
                    items: {
                        include: {
                            purchasedProduct: {
                                select: {
                                    id: true,
                                    name: true,
                                    brand: true,
                                    category: true,
                                    price: true
                                }
                            },
                            comparisonProduct: {
                                select: {
                                    id: true,
                                    name: true,
                                    brand: true,
                                    category: true,
                                    price: true
                                }
                            }
                        }
                    }
                }
            });
        });
        res.json({
            success: true,
            data: receipt,
            message: 'Receipt updated successfully'
        });
    }
    catch (error) {
        console.error('Update receipt error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update receipt'
        });
    }
});
// Delete a receipt
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
        // Check if receipt exists and belongs to user
        const existingReceipt = await database_1.prisma.receipt.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!existingReceipt) {
            res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
            return;
        }
        // Delete receipt (items will be deleted via cascade)
        await database_1.prisma.receipt.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Receipt deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete receipt error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete receipt'
        });
    }
});
// Upload receipt image (new dedicated endpoint)
router.post('/upload-image', auth_1.authenticateToken, upload_1.uploadReceiptImage, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'No receipt image uploaded'
            });
            return;
        }
        // Create image URL relative to the server
        const imageUrl = `/uploads/receipts/${req.file.filename}`;
        // Image metadata
        const imageData = {
            imageUrl,
            imageFileName: req.file.originalname,
            imageMimeType: req.file.mimetype,
            imageSize: req.file.size,
            filePath: req.file.path
        };
        res.json({
            success: true,
            data: imageData,
            message: 'Receipt image uploaded successfully'
        });
    }
    catch (error) {
        console.error('Upload receipt image error:', error);
        // Clean up uploaded file on error
        if (req.file?.path) {
            fs_1.default.unlink(req.file.path, (unlinkError) => {
                if (unlinkError)
                    console.error('Failed to delete uploaded file:', unlinkError);
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to upload receipt image'
        });
    }
});
// Upload receipt image
router.post('/upload', auth_1.authenticateToken, upload_1.uploadSingle, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
            return;
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            data: { imageUrl },
            message: 'Image uploaded successfully'
        });
    }
    catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload image'
        });
    }
});
// Get receipt summary/statistics
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
        const receipts = await database_1.prisma.receipt.findMany({
            where: {
                userId: req.user.id,
                receiptDate: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        const totalAmount = receipts.reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0);
        const totalEligible = receipts.reduce((sum, receipt) => sum + (receipt.eligibleAmount || 0), 0);
        const count = receipts.length;
        // Monthly breakdown
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const monthReceipts = receipts.filter(r => new Date(r.receiptDate).getMonth() === i);
            return {
                month: i + 1,
                count: monthReceipts.length, totalAmount: monthReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
                eligibleAmount: monthReceipts.reduce((sum, r) => sum + (r.eligibleAmount || 0), 0)
            };
        });
        res.json({
            success: true,
            data: {
                year: currentYear,
                totalAmount,
                totalEligible,
                count,
                monthlyData
            }
        });
    }
    catch (error) {
        console.error('Get receipt summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get receipt summary'
        });
    }
});
exports.default = router;
//# sourceMappingURL=receipts.js.map