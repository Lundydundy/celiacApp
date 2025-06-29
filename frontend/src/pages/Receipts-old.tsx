import { useState, useEffect } from 'react'
import { Plus, Receipt as ReceiptIcon, Search, Calendar, DollarSign, Store, Edit, Trash2, Package } from 'lucide-react'
import Navigation from '../components/Navigation'
import { receiptsAPI, productsAPI } from '../services/api'
import type { Receipt, Product } from '../types'

// Product Selection Card Component
interface ProductSelectCardProps {
  product: Product
  onSelect: (product: Product, customPrice?: string) => void
}

const ProductSelectCard = ({ product, onSelect }: ProductSelectCardProps) => {
  const [showPriceInput, setShowPriceInput] = useState(false)
  const [customPrice, setCustomPrice] = useState(product.price?.toString() || '')

  const handleSelectWithOriginalPrice = () => {
    onSelect(product)
  }

  const handleSelectWithCustomPrice = () => {
    if (customPrice && !isNaN(parseFloat(customPrice))) {
      onSelect(product, customPrice)
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="font-medium text-sm">{product.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {product.category} • {product.brand}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Original: ${product.price ? product.price.toFixed(2) : 'N/A'}
            {product.incrementalCost && (
              <span className="text-green-600 ml-2">
                (+${product.incrementalCost.toFixed(2)} deductible)
              </span>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${
          product.isGlutenFree 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {product.isGlutenFree ? 'GF' : 'Regular'}
        </span>
      </div>

      {showPriceInput ? (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Price (if different from original)
            </label>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter custom price"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectWithCustomPrice}
              className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
            >
              Use Custom Price
            </button>
            <button
              onClick={handleSelectWithOriginalPrice}
              className="flex-1 bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-400"
            >
              Use Original
            </button>
            <button
              onClick={() => setShowPriceInput(false)}
              className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleSelectWithOriginalPrice}
            className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
          >
            Select
          </button>
          <button
            onClick={() => setShowPriceInput(true)}
            className="bg-orange-500 text-white text-xs py-1 px-2 rounded hover:bg-orange-600"
          >
            Edit Price
          </button>
        </div>
      )}
    </div>
  )
}

const Receipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    storeName: '',
    date: '',
    totalAmount: '',
    eligibleAmount: '',
    imageUrl: '',
    items: [{ name: '', price: '', isEligible: true, productId: '' }],
  })

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: '',
    brand: '',
    isGlutenFree: true,
    price: '',
    regularPrice: '',
    regularProductName: '',
    notes: ''
  })
  useEffect(() => {
    loadReceipts()
    loadProducts()
  }, [])
  // Recalculate both amounts when items or products change
  useEffect(() => {
    if (products.length > 0) {
      updateCalculatedAmounts()
    }
  }, [formData.items, products])

  const loadReceipts = async () => {
    try {
      const data = await receiptsAPI.getAll()
      setReceipts(data)
    } catch (error) {
      console.error('Failed to load receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {      const receiptData = {
        storeName: formData.storeName,
        receiptDate: formData.date,
        totalAmount: parseFloat(formData.totalAmount),
        eligibleAmount: parseFloat(formData.eligibleAmount),
        imageUrl: formData.imageUrl || undefined,        items: formData.items.map(item => ({
          name: item.name,
          price: parseFloat(item.price),
          isEligible: item.isEligible,
          productId: item.productId || undefined,
        })).filter(item => item.name && !isNaN(item.price)),
      }

      if (editingReceipt) {
        await receiptsAPI.update(editingReceipt.id, receiptData)
      } else {
        await receiptsAPI.create(receiptData)
      }

      await loadReceipts()
      resetForm()
    } catch (error) {
      console.error('Failed to save receipt:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await receiptsAPI.delete(id)
        await loadReceipts()
      } catch (error) {
        console.error('Failed to delete receipt:', error)
      }
    }
  }
  const resetForm = () => {
    setFormData({
      storeName: '',
      date: '',
      totalAmount: '',
      eligibleAmount: '',
      imageUrl: '',
      items: [{ name: '', price: '', isEligible: true, productId: '' }],
    })
    setShowAddModal(false)
    setEditingReceipt(null)
  }
  const openEditModal = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setFormData({
      storeName: receipt.storeName,
      date: receipt.receiptDate ? receipt.receiptDate.split('T')[0] : '', // Convert to YYYY-MM-DD format
      totalAmount: (receipt.totalAmount || 0).toString(),
      eligibleAmount: (receipt.eligibleAmount || 0).toString(),
      imageUrl: receipt.imageUrl || '',      items: receipt.items?.length > 0 ? receipt.items.map(item => ({
        name: item.name,
        price: item.price.toString(),
        isEligible: item.isEligible,
        productId: item.productId || '',
      })) : [{ name: '', price: '', isEligible: true, productId: '' }],
    })
    setShowAddModal(true)
  }
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', price: '', isEligible: true, productId: '' }],
    })
  }
  
  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    setFormData({ ...formData, items: updatedItems })
  }
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      })
    }
  }
  const openProductModal = (index: number) => {
    setCurrentItemIndex(index)
    setProductSearchTerm('') // Reset search when opening modal
    setShowProductModal(true)
  }
  
  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  )
  
  const selectProduct = (product: Product, customPrice?: string) => {
    if (currentItemIndex !== null) {
      const updatedItems = formData.items.map((item, i) => 
        i === currentItemIndex ? { 
          ...item, 
          name: product.name,
          price: customPrice || (product.price ? product.price.toString() : ''),
          productId: product.id,
          isEligible: product.isGlutenFree
        } : item
      )
      setFormData({ ...formData, items: updatedItems })
    }
    setShowProductModal(false)
    setCurrentItemIndex(null)
    setProductSearchTerm('') // Reset search when closing
  }
  const createProduct = async () => {
    try {
      const productData = {
        ...newProductForm,
        price: newProductForm.price ? parseFloat(newProductForm.price) : undefined,
        regularPrice: newProductForm.regularPrice ? parseFloat(newProductForm.regularPrice) : undefined,
      }
      
      const createdProduct = await productsAPI.create(productData)
      await loadProducts() // Reload products list
      selectProduct(createdProduct) // Auto-select the new product (this will trigger eligible amount calculation)
      
      // Reset new product form
      setNewProductForm({
        name: '',
        category: '',
        brand: '',
        isGlutenFree: true,
        price: '',
        regularPrice: '',
        regularProductName: '',
        notes: ''
      })    } catch (error) {
      console.error('Failed to create product:', error)
    }
  }

  // Update both total amount and eligible amount whenever items change
  const updateCalculatedAmounts = () => {
    let eligibleTotal = 0
    let totalAmount = 0
    
    formData.items.forEach(item => {
      // Add to total amount if item has a price
      if (item.price) {
        totalAmount += parseFloat(item.price) || 0
      }
      
      // Only include item in eligible amount if it's marked as eligible
      console.log('Item:', item.isEligible)
      if (item.isEligible) {
        if (item.productId) {
          // If item has a linked product, use the product's incremental cost
          const product = products.find(p => p.id === item.productId)
          if (product && product.incrementalCost) {
            eligibleTotal += product.incrementalCost
          }
        } else if (item.price) {
          // If no product linked but marked as eligible, use the full price
          eligibleTotal += parseFloat(item.price) || 0
        }
      }
    })
    
    setFormData(prev => ({
      ...prev,
      totalAmount: totalAmount.toFixed(2),
      eligibleAmount: eligibleTotal.toFixed(2)
    }))
  }

  const filteredReceipts = receipts.filter(receipt => 
    receipt.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalEligible = receipts.reduce((sum, receipt) => sum + receipt.eligibleAmount, 0)
  const totalReceipts = receipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0)

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Receipts</h1>
            <p className="text-gray-600">Track receipts for tax-deductible expenses</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Receipt
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">${totalReceipts.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <ReceiptIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eligible Amount</p>
                <p className="text-2xl font-bold text-green-600">${totalEligible.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receipt Count</p>
                <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <ReceiptIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search receipts by store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>

        {/* Receipts List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : filteredReceipts.length > 0 ? (
          <div className="space-y-4">
            {filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="card p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center flex-1">
                    <div className="p-3 bg-blue-100 rounded-xl mr-4">
                      <Store className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {receipt.storeName}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(receipt.receiptDate).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Total: ${receipt.totalAmount.toFixed(2)}
                        </div>
                        
                        <div className="flex items-center text-green-600 font-medium">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Eligible: ${receipt.eligibleAmount.toFixed(2)}
                        </div>
                        
                        <div className="text-gray-500">
                          {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {receipt.items.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                          <div className="space-y-1">
                            {receipt.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className={item.isEligible ? 'text-gray-900' : 'text-gray-500'}>
                                  {item.name} {!item.isEligible && '(not eligible)'}
                                </span>
                                <span>${item.price.toFixed(2)}</span>
                              </div>
                            ))}
                            {receipt.items.length > 3 && (
                              <p className="text-sm text-gray-500">
                                +{receipt.items.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(receipt)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(receipt.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ReceiptIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Start by adding your first receipt'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Receipt
            </button>
          </div>
        )}        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingReceipt ? 'Edit Receipt' : 'Add New Receipt'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Store Name</label>
                      <input
                        type="text"
                        required
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        className="form-input"
                        placeholder="Enter store name"
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

                  <div className="grid grid-cols-2 gap-4">                    <div>
                      <label className="form-label">
                        Total Amount (Auto-calculated)
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          Sum of all item prices
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.totalAmount}
                        readOnly
                        className="form-input bg-gray-50 cursor-not-allowed"
                        placeholder="0.00"
                      />
                    </div><div>
                      <label className="form-label">
                        Eligible Amount (Auto-calculated)
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          Based on product incremental costs
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.eligibleAmount}
                        readOnly
                        className="form-input bg-gray-50 cursor-not-allowed"
                        placeholder="0.00"
                      />
                    </div>
                  </div>                  <div>
                    <label className="form-label">Receipt Items</label>
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="grid grid-cols-12 gap-2 items-end mb-2">
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                className="form-input"
                                placeholder="Item name"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateItem(index, 'price', e.target.value)}
                                className="form-input"
                                placeholder="Price"
                              />
                            </div>                            <div className="col-span-2">
                              <select
                                value={item.isEligible.toString()}
                                onChange={(e) => updateItem(index, 'isEligible', e.target.value === 'true')}
                                className={`form-input text-sm ${
                                  item.isEligible ? 'text-green-700 bg-green-50' : 'text-gray-700 bg-gray-50'
                                }`}
                              >
                                <option value="true">✓ Tax Deductible</option>
                                <option value="false">✗ Not Deductible</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <button
                                type="button"
                                onClick={() => openProductModal(index)}
                                className="btn-secondary text-sm w-full"
                              >
                                <Package className="w-4 h-4 mr-1" />
                                Select
                              </button>
                            </div>
                            <div className="col-span-2">                              {formData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="btn-secondary p-2 w-full"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              )}
                            </div>
                          </div>
                          {item.productId && (
                            <div className="text-sm text-gray-600 mt-1">
                              Product linked: {products.find(p => p.id === item.productId)?.name || 'Unknown'}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addItem}
                        className="btn-secondary flex items-center justify-center w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </button>                    </div>
                  </div>                  {/* Amount Breakdown */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">Receipt Amount Breakdown</h4>
                    
                    {/* Total Amount Breakdown */}
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-blue-700 mb-2">Total Amount (All Items)</h5>
                      <div className="space-y-1">
                        {formData.items.map((item, index) => {
                          const price = parseFloat(item.price) || 0
                          if (price > 0 && item.name) {
                            return (
                              <div key={`total-${index}`} className="flex justify-between text-xs">
                                <span className="text-gray-700">{item.name}</span>
                                <span className="font-medium text-blue-700">${price.toFixed(2)}</span>
                              </div>
                            )
                          }
                          return null
                        })}
                        <div className="border-t border-blue-300 pt-1 mt-1">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-blue-800">Total Receipt:</span>
                            <span className="text-blue-800">${formData.totalAmount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Eligible Amount Breakdown */}
                    <div>
                      <h5 className="text-xs font-medium text-green-700 mb-2">Tax Deductible Amount</h5>
                      <div className="space-y-1">
                        {formData.items.map((item, index) => {
                          // Only show eligible items
                          if (!item.isEligible) return null
                          
                          const product = item.productId ? products.find(p => p.id === item.productId) : null
                          let eligibleAmount = 0
                          
                          if (product && product.incrementalCost) {
                            eligibleAmount = product.incrementalCost
                          } else if (item.price) {
                            eligibleAmount = parseFloat(item.price) || 0
                          }
                          
                          if (eligibleAmount > 0) {
                            return (
                              <div key={`eligible-${index}`} className="flex justify-between text-xs">
                                <span className="text-gray-700">
                                  {item.name} 
                                  {product && (
                                    <span className="text-green-600 ml-1">
                                      (Incremental Cost)
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium text-green-700">
                                  ${eligibleAmount.toFixed(2)}
                                </span>
                              </div>
                            )
                          }
                          return null
                        })}
                        <div className="border-t border-green-300 pt-1 mt-1">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-green-800">Total Deductible:</span>
                            <span className="text-green-800">${formData.eligibleAmount}</span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            Only items marked as "Tax Deductible" are included.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingReceipt ? 'Update Receipt' : 'Add Receipt'}
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
          </div>        )}        {/* Product Selection Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select or Create Product</h3>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>              {/* Existing Products */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3">Select Existing Product</h4>
                
                {/* Search Box */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products by name, brand, or category..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <ProductSelectCard
                        key={product.id}
                        product={product}
                        onSelect={selectProduct}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {productSearchTerm ? 'No products found matching your search.' : 'No products available.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Create New Product */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium mb-3">Create New Product</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      value={newProductForm.name}
                      onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                      className="form-input"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      value={newProductForm.category}
                      onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select category</option>
                      <option value="Bread">Bread</option>
                      <option value="Pasta">Pasta</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Frozen">Frozen</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={newProductForm.brand}
                      onChange={(e) => setNewProductForm({...newProductForm, brand: e.target.value})}
                      className="form-input"
                      placeholder="Brand name"
                    />
                  </div>
                  <div>
                    <label className="form-label">Gluten-Free Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.price}
                      onChange={(e) => setNewProductForm({...newProductForm, price: e.target.value})}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="form-label">Regular Product Name</label>
                    <input
                      type="text"
                      value={newProductForm.regularProductName}
                      onChange={(e) => setNewProductForm({...newProductForm, regularProductName: e.target.value})}
                      className="form-input"
                      placeholder="Regular equivalent product"
                    />
                  </div>
                  <div>
                    <label className="form-label">Regular Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.regularPrice}
                      onChange={(e) => setNewProductForm({...newProductForm, regularPrice: e.target.value})}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Notes</label>
                    <textarea
                      value={newProductForm.notes}
                      onChange={(e) => setNewProductForm({...newProductForm, notes: e.target.value})}
                      className="form-input"
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={createProduct}
                    className="btn-primary"
                    disabled={!newProductForm.name || !newProductForm.category}
                  >
                    Create & Select Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Receipts
