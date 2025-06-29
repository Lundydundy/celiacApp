import { useState, useEffect, useRef } from 'react'
import { Plus, Receipt as ReceiptIcon, Search, Calendar, DollarSign, Store, Edit, Trash2, Package, X } from 'lucide-react'
import Navigation from '../components/Navigation'
import ImageUpload from '../components/ImageUpload'
import { receiptsAPI, productsAPI } from '../services/api'
import type { Receipt, Product } from '../types'

// Product Selection Component - Inline dropdown approach with price selection
interface ProductSelectorProps {
  products: Product[]
  selectedProduct?: Product
  selectedPrice?: string
  onSelect: (product: Product, price: number) => void
  onRemove: () => void
  filterGlutenFree?: boolean
  placeholder: string
  label: string
}

const ProductSelector = ({ 
  products, 
  selectedProduct, 
  selectedPrice,
  onSelect, 
  onRemove, 
  filterGlutenFree, 
  placeholder, 
  label 
}: ProductSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [selectedForPrice, setSelectedForPrice] = useState<Product | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterGlutenFree === undefined || product.isGlutenFree === filterGlutenFree
    return matchesSearch && matchesFilter
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setSelectedForPrice(null)
        setCustomPrice('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProductSelect = (product: Product) => {
    setSelectedForPrice(product)
    setCustomPrice(product.price?.toString() || '')
  }

  const handleConfirm = () => {
    if (selectedForPrice && customPrice && !isNaN(parseFloat(customPrice))) {
      onSelect(selectedForPrice, parseFloat(customPrice))
      setIsOpen(false)
      setSearchTerm('')
      setSelectedForPrice(null)
      setCustomPrice('')
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
      setSelectedForPrice(null)
      setCustomPrice('')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {selectedProduct ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-sm">{selectedProduct.name}</div>
            <div className="text-xs text-gray-600">
              {selectedProduct.category} • {selectedProduct.brand}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Price: ${selectedPrice || selectedProduct.price?.toFixed(2) || 'No price'}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={handleToggle}
            className="w-full p-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span>{placeholder}</span>
            <Package className="w-4 h-4" />
          </button>
            {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
              <div className="p-3 border-b">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="max-h-32 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`border-b border-gray-100 p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedForPrice?.id === product.id ? 'bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${
                          selectedForPrice?.id === product.id ? 'text-green-800' : ''
                        }`}>
                          {product.name}
                          {selectedForPrice?.id === product.id && (
                            <span className="ml-2 text-green-600">✓ Selected</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {product.category} {product.brand && `• ${product.brand}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {product.price ? `$${product.price.toFixed(2)}` : 'No price set'}
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
                  </div>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products found matching your search.
                  </div>
                )}
              </div>

              {selectedForPrice && (
                <div className="border-t p-4 bg-green-50">
                  <div className="text-sm font-medium mb-3 text-green-800">
                    Selected: {selectedForPrice.name}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter price"
                      />
                    </div>
                    <button
                      onClick={handleConfirm}
                      disabled={!customPrice || isNaN(parseFloat(customPrice))}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Add Product (${customPrice || '0.00'})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// New Item Form Component
interface ItemFormData {
  name: string
  price: string
  quantity: string
  isEligible: boolean
  purchasedProductId?: string
  purchasedProduct?: Product
  purchasedProductPrice?: string
  comparisonProductId?: string
  comparisonProduct?: Product
  comparisonPrice?: string
}

interface NewItemFormProps {
  item: ItemFormData
  onUpdate: (updates: Partial<ItemFormData>) => void
  onRemove: () => void
  products: Product[]
}

const NewItemForm = ({ item, onUpdate, onRemove, products }: NewItemFormProps) => {
  const totalPrice = item.price && item.quantity 
    ? parseFloat(item.price) * parseFloat(item.quantity)
    : 0

  const totalComparisonPrice = item.comparisonPrice && item.quantity
    ? parseFloat(item.comparisonPrice) * parseFloat(item.quantity)
    : 0

  const incrementalCost = totalPrice > 0 && totalComparisonPrice > 0
    ? totalPrice - totalComparisonPrice
    : 0
  const handlePurchasedProductSelect = (product: Product, price: number) => {
    onUpdate({ 
      purchasedProductId: product.id,
      purchasedProduct: product,
      purchasedProductPrice: price.toString(),
      name: item.name || product.name,
      price: item.price || price.toString()
    })
  }

  const handlePurchasedProductRemove = () => {
    onUpdate({ 
      purchasedProductId: undefined, 
      purchasedProduct: undefined,
      purchasedProductPrice: undefined,
      name: '', // Clear the name when removing the gluten-free product
      price: '' // Clear the price when removing the gluten-free product
    })
  }

  const handleComparisonProductSelect = (product: Product, price: number) => {
    onUpdate({ 
      comparisonProductId: product.id,
      comparisonProduct: product,
      comparisonPrice: price.toString()
    })
  }

  const handleComparisonProductRemove = () => {
    onUpdate({ 
      comparisonProductId: undefined, 
      comparisonProduct: undefined,
      comparisonPrice: undefined
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">Receipt Item</h4>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>      {/* Manual Item Name, Price, and Quantity */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            required
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter item name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Price ($) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={item.price}
            onChange={(e) => onUpdate({ price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="1"
          />
        </div>
      </div>

      {/* Total Price Display */}
      {item.price && item.quantity && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Total Price:</span>
            <span className="font-medium text-blue-700">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ${parseFloat(item.price).toFixed(2)} × {item.quantity} = ${totalPrice.toFixed(2)}
          </div>
        </div>
      )}{/* Product Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProductSelector
          products={products}
          selectedProduct={item.purchasedProduct}
          selectedPrice={item.purchasedProductPrice}
          onSelect={handlePurchasedProductSelect}
          onRemove={handlePurchasedProductRemove}
          filterGlutenFree={true}
          placeholder="+ Select Gluten-Free Product"
          label="Link to Gluten-Free Product (Optional)"
        />

        <ProductSelector
          products={products}
          selectedProduct={item.comparisonProduct}
          selectedPrice={item.comparisonPrice}
          onSelect={handleComparisonProductSelect}
          onRemove={handleComparisonProductRemove}
          filterGlutenFree={false}
          placeholder="+ Select Regular Product to Compare"
          label="Compare Against Regular Product (Optional)"
        />
      </div>      {/* Calculation Display */}
      {totalPrice > 0 && totalComparisonPrice > 0 && (
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Incremental Cost:</span>
            <span className="font-medium text-green-700">
              ${incrementalCost.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ${totalPrice.toFixed(2)} (paid total) - ${totalComparisonPrice.toFixed(2)} (regular total) = ${incrementalCost.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Based on {item.quantity} × (${parseFloat(item.price || '0').toFixed(2)} - ${parseFloat(item.comparisonPrice || '0').toFixed(2)}) per unit
          </div>
        </div>
      )}

      {/* Tax Eligible Checkbox */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={item.isEligible}
            onChange={(e) => onUpdate({ isEligible: e.target.checked })}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="ml-2 text-sm text-gray-700">Include in tax deductible amount</span>
        </label>        {item.isEligible && incrementalCost > 0 && (
          <div className="text-xs text-green-600 mt-1">
            ${incrementalCost.toFixed(2)} will be added to eligible amount
          </div>
        )}</div>
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

  const [formData, setFormData] = useState({
    storeName: '',
    date: '',
    totalAmount: '',
    eligibleAmount: '',
    imageUrl: '',
    imageFileName: '',
    imageMimeType: '',
    imageSize: 0,
    items: [] as ItemFormData[],
  })

  useEffect(() => {
    loadReceipts()
    loadProducts()
  }, [])
  
  // Auto-calculate amounts when items change
  useEffect(() => {
    updateCalculatedAmounts()
  }, [formData.items])

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
      setProducts(data)    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const updateCalculatedAmounts = () => {
    console.log('Calculating amounts for items:', formData.items)
    const totalAmount = formData.items
      .filter(item => item.price && item.quantity && !isNaN(parseFloat(item.price)) && !isNaN(parseFloat(item.quantity)))
      .reduce((sum, item) => sum + (parseFloat(item.price) * parseFloat(item.quantity)), 0)

    const eligibleAmount = formData.items
      .filter(item => item.isEligible && item.price && item.quantity && !isNaN(parseFloat(item.price)) && !isNaN(parseFloat(item.quantity)))
      .reduce((sum, item) => {
        const unitPrice = parseFloat(item.price)
        const quantity = parseFloat(item.quantity)
        const totalPrice = unitPrice * quantity
        
        const comparisonPrice = item.comparisonPrice ? parseFloat(item.comparisonPrice) : 0
        const totalComparisonPrice = comparisonPrice * quantity
        
        // If there's a comparison price, use incremental cost, otherwise use full price
        const deductibleAmount = totalComparisonPrice > 0 ? Math.max(0, totalPrice - totalComparisonPrice) : totalPrice
        return sum + deductibleAmount
      }, 0)

    console.log('Calculated totals - Total:', totalAmount, 'Eligible:', eligibleAmount)

    setFormData(prev => ({
      ...prev,
      totalAmount: totalAmount.toFixed(2),
      eligibleAmount: eligibleAmount.toFixed(2)
    }))
  }

  const handleImageSelect = (imageData: {
    imageUrl: string
    imageFileName: string
    imageMimeType: string
    imageSize: number
  }) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: imageData.imageUrl,
      imageFileName: imageData.imageFileName,
      imageMimeType: imageData.imageMimeType,
      imageSize: imageData.imageSize
    }))
  }

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: '',
      imageFileName: '',
      imageMimeType: '',
      imageSize: 0
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const receiptData = {
        storeName: formData.storeName,
        receiptDate: formData.date,
        totalAmount: parseFloat(formData.totalAmount),
        eligibleAmount: parseFloat(formData.eligibleAmount),
        imageUrl: formData.imageUrl || undefined,
        imageFileName: formData.imageFileName || undefined,
        imageMimeType: formData.imageMimeType || undefined,
        imageSize: formData.imageSize || undefined,        items: formData.items.map(item => {
          const unitPrice = parseFloat(item.price)
          const quantity = parseFloat(item.quantity)
          const totalPrice = unitPrice * quantity
          
          const comparisonPrice = item.comparisonPrice ? parseFloat(item.comparisonPrice) : undefined
          const totalComparisonPrice = comparisonPrice ? comparisonPrice * quantity : undefined
          const incrementalCost = totalComparisonPrice ? totalPrice - totalComparisonPrice : undefined

          return {
            name: item.name,
            price: totalPrice, // Store total price (unit price × quantity)
            quantity: quantity,
            isEligible: item.isEligible,
            purchasedProductId: item.purchasedProductId || undefined,
            comparisonProductId: item.comparisonProductId || undefined,
            comparisonPrice: totalComparisonPrice,
            incrementalCost: incrementalCost
          }
        }).filter(item => item.name && !isNaN(item.price) && item.quantity > 0),
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
      alert('Failed to save receipt. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {      try {
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
      imageFileName: '',
      imageMimeType: '',
      imageSize: 0,
      items: [],
    })
    setEditingReceipt(null)
    setShowAddModal(false)
  }
  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setFormData({
      storeName: receipt.storeName,
      date: receipt.receiptDate.split('T')[0],
      totalAmount: receipt.totalAmount.toString(),
      eligibleAmount: receipt.eligibleAmount.toString(),
      imageUrl: receipt.imageUrl || '',
      imageFileName: receipt.imageFileName || '',
      imageMimeType: receipt.imageMimeType || '',
      imageSize: receipt.imageSize || 0,      items: receipt.items.map(item => {
        const quantity = item.quantity || 1
        const unitPrice = item.price / quantity // Calculate unit price from total price
        
        return {
          name: item.name,
          price: unitPrice.toString(),
          quantity: quantity.toString(),
          isEligible: item.isEligible,
          purchasedProductId: item.purchasedProductId,
          purchasedProduct: item.purchasedProduct,
          purchasedProductPrice: item.comparisonPrice ? (item.comparisonPrice / quantity).toString() : undefined,
          comparisonProductId: item.comparisonProductId,
          comparisonProduct: item.comparisonProduct,
          comparisonPrice: item.comparisonPrice ? (item.comparisonPrice / quantity).toString() : undefined
        }
      }),
    })
    setShowAddModal(true)
  }
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: '', quantity: '1', isEligible: true }]
    }))
  }
  const updateItem = (index: number, updates: Partial<ItemFormData>) => {
    console.log(`Updating item ${index} with:`, updates)
    console.log(`Current item ${index} state:`, formData.items[index])
    setFormData(prev => {
      const newItems = prev.items.map((item, i) => i === index ? { ...item, ...updates } : item)
      console.log(`New item ${index} state:`, newItems[index])
      return {
        ...prev,
        items: newItems
      }
    })
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }
  const filteredReceipts = receipts.filter(receipt =>
    receipt.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading receipts...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <ReceiptIcon className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Receipt
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Receipts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReceipts.map((receipt) => (
            <div key={receipt.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Store className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{receipt.storeName}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(receipt)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(receipt.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Date:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(receipt.receiptDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Total:
                    </span>
                    <span className="text-sm font-medium">${receipt.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Eligible:</span>
                    <span className="text-sm font-medium text-green-600">
                      ${receipt.eligibleAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      Items:
                    </span>
                    <span className="text-sm font-medium">{receipt.items.length}</span>
                  </div>

                  {/* Show breakdown of items with comparisons */}
                  {receipt.items.some(item => item.incrementalCost) && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500 mb-1">Comparison savings:</div>
                      {receipt.items
                        .filter(item => item.incrementalCost && item.incrementalCost > 0)
                        .slice(0, 2)
                        .map((item, idx) => (
                          <div key={idx} className="text-xs text-green-600">
                            {item.name}: +${item.incrementalCost!.toFixed(2)}
                          </div>
                        ))}
                      {receipt.items.filter(item => item.incrementalCost && item.incrementalCost > 0).length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{receipt.items.filter(item => item.incrementalCost && item.incrementalCost > 0).length - 2} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReceipts.length === 0 && (
          <div className="text-center py-12">
            <ReceiptIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria.' 
                : 'Get started by adding your first receipt.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Receipt
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Receipt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingReceipt ? 'Edit Receipt' : 'Add Receipt'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Receipt Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter store name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount ($) <span className="text-xs text-gray-500">(auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eligible Amount ($) <span className="text-xs text-gray-500">(auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.eligibleAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImageUrl={formData.imageUrl}
                onImageRemove={handleImageRemove}
              />

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Receipt Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </button>
                </div>                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <NewItemForm
                      key={index}
                      item={item}
                      onUpdate={(updates) => updateItem(index, updates)}
                      onRemove={() => removeItem(index)}
                      products={products}
                    />
                  ))}
                  
                  {formData.items.length === 0 && (
                    <div className="text-center py-8 border border-gray-200 border-dashed rounded-lg">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No items added yet</p>
                      <button
                        type="button"
                        onClick={addItem}
                        className="mt-2 text-blue-600 hover:text-blue-700"
                      >
                        Add your first item
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {formData.items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span>{formData.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span>${formData.totalAmount}</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-700">
                      <span>Eligible Amount:</span>
                      <span>${formData.eligibleAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.items.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {editingReceipt ? 'Update' : 'Create'} Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Receipts
