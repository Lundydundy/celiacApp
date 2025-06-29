import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  DollarSign, 
  Receipt, 
  Package, 
  Stethoscope, 
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react'
import Navigation from '../components/Navigation'
import { taxAPI, receiptsAPI, medicalAPI, productsAPI } from '../services/api'
import type { TaxSummary } from '../types'

const Dashboard = () => {
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [productsCount, setProductsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summary, receipts, medical, products] = await Promise.all([
          taxAPI.getSummary(),
          receiptsAPI.getAll(),
          medicalAPI.getAll(),
          productsAPI.getAll(),
        ])
        
        setTaxSummary(summary)
        setProductsCount(products.length)
        
        // Combine recent receipts and medical expenses for activity feed
        const recent = [
          ...receipts.slice(0, 3).map(r => ({ ...r, type: 'receipt' })),
          ...medical.slice(0, 3).map(m => ({ ...m, type: 'medical' })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        setRecentActivity(recent.slice(0, 5))
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const stats = [
    {
      name: 'Total Deductible',
      value: taxSummary ? `$${(taxSummary.totalDeductible || 0).toFixed(2)}` : '$0.00',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+12%',
    },
    {
      name: 'Receipts',
      value: taxSummary?.receiptsCount || 0,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+3',
    },
    {
      name: 'Medical Expenses',
      value: taxSummary ? `$${(taxSummary.totalMedicalExpenses || 0).toFixed(2)}` : '$0.00',
      icon: Stethoscope,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+8%',
    },    {
      name: 'Products Tracked',
      value: productsCount || 0,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '+2',
    },
  ]

  const quickActions = [
    {
      name: 'Add Receipt',
      href: '/receipts',
      icon: Receipt,
      description: 'Upload and track a new receipt',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Add Product',
      href: '/products',
      icon: Package,
      description: 'Add a gluten-free product',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Medical Expense',
      href: '/medical',
      icon: Stethoscope,
      description: 'Log medical expenses',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ]

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your celiac-related expenses and deductions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.name}
                      to={action.href}
                      className={`flex items-center p-4 rounded-xl text-white transition-all duration-200 transform hover:scale-105 ${action.color}`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <div>
                        <p className="font-medium">{action.name}</p>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Link to="/receipts" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all
                </Link>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className={`p-2 rounded-lg mr-4 ${
                        item.type === 'receipt' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {item.type === 'receipt' ? (
                          <Receipt className={`w-4 h-4 ${
                            item.type === 'receipt' ? 'text-blue-600' : 'text-purple-600'
                          }`} />
                        ) : (
                          <Stethoscope className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.type === 'receipt' ? item.storeName : item.description}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.type === 'receipt'                            ? `$${(item.eligibleAmount || 0).toFixed(2)} eligible amount`
                            : `$${(item.amount || 0).toFixed(2)} medical expense`
                          }
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.date || item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                  <p className="text-sm text-gray-500">Start by adding receipts or medical expenses</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tax Summary Card */}
        <div className="mt-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tax Summary {taxSummary?.year}</h3>
              <Link 
                to="/tax-summary" 
                className="btn-secondary flex items-center"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${(taxSummary?.totalDeductible || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Deductible</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ${(taxSummary?.totalEligibleAmount || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Eligible Receipts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  ${(taxSummary?.totalMedicalExpenses || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Medical Expenses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
