import { useState, useEffect } from 'react'
import { Plus, Package, Search, Filter, Edit, Trash2, Check, X } from 'lucide-react'
import Navigation from '../components/Navigation'
import { productsAPI } from '../services/api'
import type { Product } from '../types'

const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    isGlutenFree: true,
    price: '',
    notes: '',
  })

  const categories = ['Bread & Bakery', 'Pasta', 'Snacks', 'Frozen', 'Dairy', 'Beverages', 'Other']

  useEffect(() => {
    loadProducts()
  }, [])
  
  const loadProducts = async () => {
    try {
      console.log('Starting to load products...')
      const token = localStorage.getItem('token')
      console.log('Auth token exists:', !!token)
      
      const data = await productsAPI.getAll()
      console.log('Products API response:', data)
      console.log('Is array?', Array.isArray(data))
      console.log('Products count:', data?.length)
      setProducts(data)    } catch (error: any) {
      console.error('Failed to load products:', error)
      if (error.response) {
        console.error('Error status:', error.response.status)
        console.error('Error data:', error.response.data)
      }      setProducts([]) // Ensure we always have an array
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
      }

      console.log('Submitting product data:', productData)

      if (editingProduct) {
        console.log('Updating product:', editingProduct.id)
        await productsAPI.update(editingProduct.id, productData)
      } else {
        console.log('Creating new product')
        const result = await productsAPI.create(productData)
        console.log('Product created:', result)
      }

      await loadProducts()
      resetForm()
    } catch (error) {
      console.error('Failed to save product:', error)
      // Show error details for debugging
      if (error instanceof Error) {
        alert(`Error: ${error.message}`)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id)
        await loadProducts()
      } catch (error) {        console.error('Failed to delete product:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      isGlutenFree: true,
      price: '',
      notes: '',
    })
    setEditingProduct(null)
    setShowAddModal(false)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      isGlutenFree: product.isGlutenFree,
      price: product.price?.toString() || '',
      notes: product.notes || '',
    })
    setShowAddModal(true)
  }

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    if (!product || typeof product !== 'object') return false
    
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesCategory
  }) : []

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600">Track gluten-free products for tax deductions</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={loadProducts}
              className="btn-secondary"
            >
              Refresh Products
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="card p-4 mb-6 bg-yellow-50 border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Info</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>Products array length: {products.length}</p>
            <p>Filtered products length: {filteredProducts.length}</p>
            <p>Auth token exists: {!!localStorage.getItem('token') ? 'true' : 'false'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input pl-10 appearance-none"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="card p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.brand}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className="text-sm font-medium text-gray-900">{product.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gluten-Free</span>
                    <div className="flex items-center">
                      {product.isGlutenFree ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>                  {product.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">GF Price</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>                    </div>
                  )}

                  {product.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{product.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter ? 'Try adjusting your filters' : 'Start by adding your first product'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Product
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-panel">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="form-input"
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="form-input"
                        placeholder="Enter brand"
                      />
                    </div>
                  </div>                  <div>
                    <label className="form-label">Price (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="form-input"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave blank if price varies by store
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Gluten-Free</label>
                      <select
                        value={formData.isGlutenFree.toString()}
                        onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.value === 'true' })}
                        className="form-input"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-input"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingProduct ? 'Update Product' : 'Add Product'}
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

export default Products
