import { Router, Request, Response } from 'express'
import { prisma } from '../lib/database'
import { authenticateToken } from '../middleware/auth'
import { ProductRequest, AuthenticatedRequest, PaginationOptions } from '../types'

const router = Router()

// Get all products for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { page = 1, limit = 1000, sortBy = 'createdAt', sortOrder = 'desc', category, search } = req.query as any

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)    // Build where clause
    const where: any = {
      OR: [
        { userId: req.user.id }, // User's own products
        { 
          user: { 
            email: 'admin@celiacapp.com' // Include public/imported products
          } 
        }
      ]
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ]
    }    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          category: true,
          brand: true,
          isGlutenFree: true,
          price: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.product.count({ where })
    ])

    res.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    })
  }
})

// Get product categories (for filtering) - MUST come before /:id route
router.get('/categories/list', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const categories = await prisma.product.findMany({
      where: { userId: req.user.id },
      select: { category: true },
      distinct: ['category']
    })

    const categoryList = categories.map(c => c.category).sort()

    res.json({
      success: true,
      data: categoryList
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    })
  }
})

// Get a single product by ID
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id }, // User's own products
          { 
            user: { 
              email: 'admin@celiacapp.com' // Include public/imported products
            } 
          }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        isGlutenFree: true,
        price: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      })
      return
    }    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get product'
    })
  }
})

// Create a new product
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }    const { name, category, brand, isGlutenFree, price, notes } = req.body as ProductRequest

    // Validation
    if (!name || !category) {
      res.status(400).json({
        success: false,
        error: 'Name and category are required'
      })
      return
    }

    if (price !== undefined && price < 0) {
      res.status(400).json({
        success: false,
        error: 'Price cannot be negative'
      })
      return
    }    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        brand: brand?.trim(),
        isGlutenFree: isGlutenFree ?? true,
        price,
        notes: notes?.trim(),
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        isGlutenFree: true,
        price: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    })
  }
})

// Update a product
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }    const { id } = req.params
    const { name, category, brand, isGlutenFree, price, notes } = req.body as Partial<ProductRequest>    // Check if product exists and belongs to user OR is an imported/public product
    let existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        isGlutenFree: true,
        price: true,
        notes: true,
        userId: true
      }
    })

    // If not found, check if it's an imported/public product (admin product)
    if (!existingProduct) {
      const publicProduct = await prisma.product.findFirst({
        where: {
          id,
          user: { email: 'admin@celiacapp.com' }
        },
        select: {
          id: true,
          name: true,
          category: true,
          brand: true,
          isGlutenFree: true,
          price: true,
          notes: true,
          userId: true
        }
      })

      if (publicProduct) {
        // Create a copy for the user
        existingProduct = await prisma.product.create({
          data: {
            name: publicProduct.name,
            category: publicProduct.category,
            brand: publicProduct.brand,
            isGlutenFree: publicProduct.isGlutenFree,
            price: publicProduct.price,
            notes: publicProduct.notes,
            userId: req.user.id
          },
          select: {
            id: true,
            name: true,
            category: true,
            brand: true,
            isGlutenFree: true,
            price: true,
            notes: true,
            userId: true
          }
        })
      }
    }

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      })
      return
    }// Validation
    if (price !== undefined && price < 0) {
      res.status(400).json({
        success: false,
        error: 'Price cannot be negative'
      })
      return
    }

    // Build update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (category !== undefined) updateData.category = category.trim()
    if (brand !== undefined) updateData.brand = brand?.trim()
    if (isGlutenFree !== undefined) updateData.isGlutenFree = isGlutenFree
    if (price !== undefined) updateData.price = price
    if (notes !== undefined) updateData.notes = notes?.trim()

    const product = await prisma.product.update({
      where: { id: existingProduct.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        isGlutenFree: true,
        price: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    })
  }
})

// Delete a product
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

    // Check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    })

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      })
      return
    }

    await prisma.product.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    })
  }
})

export default router
