import { useState, useEffect } from 'react'
import { Plus, Stethoscope, Search, Calendar, DollarSign, Edit, Trash2, FileText } from 'lucide-react'
import Navigation from '../components/Navigation'
import { medicalAPI } from '../services/api'
import type { MedicalExpense } from '../types'

const Medical = () => {
  const [expenses, setExpenses] = useState<MedicalExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<MedicalExpense | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: 'consultation' as 'consultation' | 'medication' | 'test' | 'supplement' | 'other',
    provider: '',
    notes: '',
  })

  const categories = [
    { value: 'consultation', label: 'Medical Consultation' },
    { value: 'medication', label: 'Medication' },
    { value: 'test', label: 'Medical Test' },
    { value: 'supplement', label: 'Supplements' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      const data = await medicalAPI.getAll()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to load medical expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        provider: formData.provider || undefined,
        notes: formData.notes || undefined,
      }

      if (editingExpense) {
        await medicalAPI.update(editingExpense.id, expenseData)
      } else {
        await medicalAPI.create(expenseData)
      }

      await loadExpenses()
      resetForm()
    } catch (error) {
      console.error('Failed to save medical expense:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medical expense?')) {
      try {
        await medicalAPI.delete(id)
        await loadExpenses()
      } catch (error) {
        console.error('Failed to delete medical expense:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: '',
      category: 'consultation',
      provider: '',
      notes: '',
    })
    setShowAddModal(false)
    setEditingExpense(null)
  }

  const openEditModal = (expense: MedicalExpense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date.split('T')[0], // Convert to YYYY-MM-DD format
      category: expense.category,
      provider: expense.provider || '',
      notes: expense.notes || '',
    })
    setShowAddModal(true)
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.provider?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currentYear = new Date().getFullYear()
  const currentYearExpenses = expenses.filter(expense => 
    new Date(expense.date).getFullYear() === currentYear
  ).reduce((sum, expense) => sum + expense.amount, 0)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'consultation': return <Stethoscope className="w-5 h-5" />
      case 'medication': return <FileText className="w-5 h-5" />
      case 'test': return <Search className="w-5 h-5" />
      case 'supplement': return <Plus className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consultation': return 'bg-blue-100 text-blue-600'
      case 'medication': return 'bg-green-100 text-green-600'
      case 'test': return 'bg-purple-100 text-purple-600'
      case 'supplement': return 'bg-orange-100 text-orange-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Expenses</h1>
            <p className="text-gray-600">Track medical expenses related to celiac disease</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Year</p>
                <p className="text-2xl font-bold text-green-600">${currentYearExpenses.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : filteredExpenses.length > 0 ? (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => {
              const categoryInfo = categories.find(c => c.value === expense.category)
              return (
                <div key={expense.id} className="card p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`p-3 rounded-xl mr-4 ${getCategoryColor(expense.category)}`}>
                        {getCategoryIcon(expense.category)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {expense.description}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                            {categoryInfo?.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                          
                          <div className="flex items-center text-green-600 font-medium">
                            <DollarSign className="w-4 h-4 mr-2" />
                            ${expense.amount.toFixed(2)}
                          </div>
                          
                          {expense.provider && (
                            <div className="text-gray-600">
                              Provider: {expense.provider}
                            </div>
                          )}
                        </div>

                        {expense.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">{expense.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medical expenses found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter ? 'Try adjusting your filters' : 'Start by adding your first medical expense'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Medical Expense
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-panel">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingExpense ? 'Edit Medical Expense' : 'Add New Medical Expense'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="form-input"
                      placeholder="Describe the medical expense"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="form-input"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="form-input"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Provider (optional)</label>
                      <input
                        type="text"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="form-input"
                        placeholder="Doctor, clinic, pharmacy..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-input"
                      rows={3}
                      placeholder="Additional notes about this expense..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingExpense ? 'Update Expense' : 'Add Expense'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Medical
