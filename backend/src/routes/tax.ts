import { Router, Request, Response } from 'express'
import { prisma } from '../lib/database'
import { authenticateToken } from '../middleware/auth'
import { AuthenticatedRequest, TaxProfileRequest } from '../types'

const router = Router()

// Get tax summary for the authenticated user
router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { year } = req.query as { year?: string }
    const currentYear = year ? Number(year) : new Date().getFullYear()

    // Calculate date range for the tax year
    const startDate = new Date(currentYear, 0, 1) // January 1st
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999) // December 31st

    // Get all eligible receipts for the year
    const receipts = await prisma.receipt.findMany({
      where: {
        userId: req.user.id,
        receiptDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: true
      }
    })

    // Get all medical expenses for the year
    const medicalExpenses = await prisma.medicalExpense.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate totals
    const totalReceiptAmount = receipts.reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0)
    const totalEligibleAmount = receipts.reduce((sum, receipt) => sum + (receipt.eligibleAmount || 0), 0)
    const totalMedicalExpenses = medicalExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

    // Calculate incremental cost (the extra cost of gluten-free items)
    const incrementalCost = totalEligibleAmount

    // Calculate total claimable amount (incremental cost + medical expenses)
    const totalClaimableAmount = incrementalCost + totalMedicalExpenses

    // Medical expense threshold (3% of net income, but we'll use a placeholder)
    // In a real app, you'd need to get the user's income information
    const medicalExpenseThreshold = 2500 // Placeholder amount
    const claimableAfterThreshold = Math.max(0, totalMedicalExpenses - medicalExpenseThreshold)

    // Calculate monthly breakdown
    const monthlyBreakdown = []
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1)
      const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59, 999)

      const monthReceipts = receipts.filter(r => 
        r.receiptDate >= monthStart && r.receiptDate <= monthEnd
      )
      const monthMedical = medicalExpenses.filter((e: any) => 
        e.date >= monthStart && e.date <= monthEnd
      )

      monthlyBreakdown.push({
        month: month + 1,
        monthName: monthStart.toLocaleString('default', { month: 'long' }),
        receipts: {
          count: monthReceipts.length,
          totalAmount: monthReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
          eligibleAmount: monthReceipts.reduce((sum, r) => sum + (r.eligibleAmount || 0), 0)
        },
        medical: {
          count: monthMedical.length,
          totalAmount: monthMedical.reduce((sum: number, e: any) => sum + e.amount, 0)
        }
      })
    }    // Category breakdown for medical expenses
    const medicalByCategory = medicalExpenses.reduce((acc: any, expense: any) => {
      const category = expense.category || 'other'
      if (!acc[category]) {
        acc[category] = { count: 0, amount: 0 }
      }
      acc[category].count++
      acc[category].amount += expense.amount
      return acc
    }, {})

    res.json({
      totalEligibleAmount: totalEligibleAmount,
      totalMedicalExpenses: totalMedicalExpenses,
      totalDeductible: totalClaimableAmount,
      receiptsCount: receipts.length,
      medicalExpensesCount: medicalExpenses.length,
      year: currentYear
    })

  } catch (error) {
    console.error('Error getting tax summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get tax summary'
    })
  }
})

// Get tax deduction estimate
router.get('/deduction-estimate', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { year, income } = req.query as { year?: string, income?: string }
    const currentYear = year ? Number(year) : new Date().getFullYear()
    const annualIncome = income ? Number(income) : 50000 // Default placeholder

    // Calculate date range for the tax year
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999)

    // Get eligible amounts
    const receipts = await prisma.receipt.findMany({
      where: {
        userId: req.user.id,
        receiptDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const medicalExpenses = await prisma.medicalExpense.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalEligibleAmount = receipts.reduce((sum, receipt) => sum + (receipt.eligibleAmount || 0), 0)
    const totalMedicalExpenses = medicalExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

    // Calculate medical expense threshold (3% of net income or $2,500, whichever is less)
    const thresholdPercent = annualIncome * 0.03
    const medicalExpenseThreshold = Math.min(thresholdPercent, 2500)

    // Calculate claimable amounts
    const claimableMedical = Math.max(0, totalMedicalExpenses - medicalExpenseThreshold)
    const claimableGlutenFree = totalEligibleAmount // Full amount for gluten-free incremental costs

    const totalClaimable = claimableMedical + claimableGlutenFree

    // Estimate tax savings (assuming 25% marginal tax rate - this would need to be calculated properly)
    const estimatedTaxRate = 0.25
    const estimatedTaxSavings = totalClaimable * estimatedTaxRate

    res.json({
      year: currentYear,
      income: annualIncome,
      thresholds: {
        medicalExpenseThreshold,
        thresholdPercent
      },
      amounts: {
        totalMedicalExpenses,
          claimableMedical,
          totalEligibleAmount,
          claimableGlutenFree,
          totalClaimable
        },        estimates: {
          taxRate: estimatedTaxRate,
          estimatedTaxSavings
        }
    })
  } catch (error) {
    console.error('Error calculating tax deduction estimate:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to calculate tax deduction estimate'
    })
  }
})

// Get tax profile for a specific year
router.get('/profile/:year', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const year = parseInt(req.params.year)
    
    const taxProfile = await prisma.taxProfile.findUnique({
      where: {
        userId_year: {
          userId: req.user.id,
          year: year
        }
      }
    })

    if (!taxProfile) {
      res.status(404).json({
        success: false,
        error: 'Tax profile not found for this year'
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: taxProfile.id,
        year: taxProfile.year,
        netIncome: taxProfile.netIncome,
        dependantIncome: taxProfile.dependantIncome,
        claimingFor: taxProfile.claimingFor,
        createdAt: taxProfile.createdAt.toISOString(),
        updatedAt: taxProfile.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error getting tax profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get tax profile'
    })
  }
})

// Create or update tax profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { year, netIncome, dependantIncome, claimingFor } = req.body as TaxProfileRequest

    if (!year || year < 2000 || year > new Date().getFullYear() + 1) {
      res.status(400).json({
        success: false,
        error: 'Valid year is required'
      })
      return
    }

    const taxProfile = await prisma.taxProfile.upsert({
      where: {
        userId_year: {
          userId: req.user.id,
          year: year
        }
      },
      update: {
        netIncome: netIncome,
        dependantIncome: dependantIncome,
        claimingFor: claimingFor || 'self'
      },
      create: {
        userId: req.user.id,
        year: year,
        netIncome: netIncome,
        dependantIncome: dependantIncome,
        claimingFor: claimingFor || 'self'
      }
    })

    res.json({
      success: true,
      data: {
        id: taxProfile.id,
        year: taxProfile.year,
        netIncome: taxProfile.netIncome,
        dependantIncome: taxProfile.dependantIncome,
        claimingFor: taxProfile.claimingFor,
        createdAt: taxProfile.createdAt.toISOString(),
        updatedAt: taxProfile.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving tax profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save tax profile'
    })
  }
})

export default router
