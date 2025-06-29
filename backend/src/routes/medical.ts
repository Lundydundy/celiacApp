import { Router, Request, Response } from 'express'
import { prisma } from '../lib/database'
import { authenticateToken } from '../middleware/auth'
import { MedicalExpenseRequest, AuthenticatedRequest } from '../types'

const router = Router()

// Get all medical expenses for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { page = 1, limit = 50, sortBy = 'date', sortOrder = 'desc', category, year, month } = req.query as any

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    // Build where clause
    const where: any = {
      userId: req.user.id
    }

    if (category) {
      where.category = category
    }

    // Filter by year/month if provided
    if (year) {
      const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1)
      const endDate = month 
        ? new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
        : new Date(Number(year) + 1, 0, 0, 23, 59, 59, 999)
      
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get medical expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.medicalExpense.findMany({
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
      prisma.medicalExpense.count({ where })
    ])

    res.json(expenses)
  } catch (error) {
    console.error('Get medical expenses error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get medical expenses'
    })
  }
})

// Get a single medical expense by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { id } = req.params

    const expense = await prisma.medicalExpense.findFirst({
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
    })

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Medical expense not found'
      })
      return
    }

    res.json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('Get medical expense error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get medical expense'
    })
  }
})

// Create a new medical expense
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { description, amount, date, category, provider, notes } = req.body as MedicalExpenseRequest

    // Validation
    if (!description || amount === undefined || !date || !category) {
      res.status(400).json({
        success: false,
        error: 'Description, amount, date, and category are required'
      })
      return
    }

    if (amount < 0) {
      res.status(400).json({
        success: false,
        error: 'Amount cannot be negative'
      })
      return
    }

    const validCategories = ['consultation', 'medication', 'test', 'supplement', 'other']
    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category'
      })
      return
    }

    const expense = await prisma.medicalExpense.create({
      data: {
        description: description.trim(),
        amount,
        date: new Date(date),
        category: category as any,
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
    })

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Medical expense created successfully'
    })
  } catch (error) {
    console.error('Create medical expense error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create medical expense'
    })
  }
})

// Update a medical expense
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { id } = req.params
    const { description, amount, date, category, provider, notes } = req.body as Partial<MedicalExpenseRequest>

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.medicalExpense.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingExpense) {
      res.status(404).json({
        success: false,
        error: 'Medical expense not found'
      })
      return
    }

    // Validation
    if (amount !== undefined && amount < 0) {
      res.status(400).json({
        success: false,
        error: 'Amount cannot be negative'
      })
      return
    }

    if (category !== undefined) {
      const validCategories = ['consultation', 'medication', 'test', 'supplement', 'other']
      if (!validCategories.includes(category)) {
        res.status(400).json({
          success: false,
          error: 'Invalid category'
        })
        return
      }
    }

    // Build update data
    const updateData: any = {}
    
    if (description !== undefined) updateData.description = description.trim()
    if (amount !== undefined) updateData.amount = amount
    if (date !== undefined) updateData.date = new Date(date)
    if (category !== undefined) updateData.category = category
    if (provider !== undefined) updateData.provider = provider?.trim()
    if (notes !== undefined) updateData.notes = notes?.trim()

    const expense = await prisma.medicalExpense.update({
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
    })

    res.json({
      success: true,
      data: expense,
      message: 'Medical expense updated successfully'
    })
  } catch (error) {
    console.error('Update medical expense error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update medical expense'
    })
  }
})

// Delete a medical expense
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { id } = req.params

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.medicalExpense.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingExpense) {
      res.status(404).json({
        success: false,
        error: 'Medical expense not found'
      })
      return
    }

    await prisma.medicalExpense.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Medical expense deleted successfully'
    })
  } catch (error) {
    console.error('Delete medical expense error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete medical expense'
    })
  }
})

// Get medical expense categories
router.get('/categories/list', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = [
      { value: 'consultation', label: 'Medical Consultation' },
      { value: 'medication', label: 'Medication' },
      { value: 'test', label: 'Medical Test' },
      { value: 'supplement', label: 'Supplements' },
      { value: 'other', label: 'Other' }
    ]

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    })
  }
})

// Get medical expense summary/statistics
router.get('/summary/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { year } = req.query as any
    const currentYear = year ? Number(year) : new Date().getFullYear()

    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear + 1, 0, 0, 23, 59, 59, 999)

    const expenses = await prisma.medicalExpense.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const count = expenses.length

    // Category breakdown
    const categoryData = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthExpenses = expenses.filter(e => new Date(e.date).getMonth() === i)
      return {
        month: i + 1,
        count: monthExpenses.length,
        amount: monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      }
    })

    res.json({
      success: true,
      data: {
        year: currentYear,
        totalAmount,
        count,
        categoryData,
        monthlyData
      }
    })
  } catch (error) {
    console.error('Get medical expense summary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get medical expense summary'
    })
  }
})

export default router
