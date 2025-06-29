import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/database'
import { AuthenticatedRequest } from '../types'

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      })
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables')
      res.status(500).json({
        success: false,
        error: 'Server configuration error'
      })
      return
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
      return
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      next()
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      next()
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (user) {
      req.user = user
    }

    next()
  } catch (error) {
    // If optional auth fails, just continue without user
    next()
  }
}
