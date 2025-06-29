import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react'

interface ImageUploadProps {
  onImageSelect: (imageData: {
    imageUrl: string
    imageFileName: string
    imageMimeType: string
    imageSize: number
  }) => void
  currentImageUrl?: string
  onImageRemove?: () => void
  className?: string
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImageUrl,
  onImageRemove,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or HEIC)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('receiptImage', file)

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/receipts/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        onImageSelect(result.data)
      } else {
        throw new Error(result.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    if (onImageRemove) {
      onImageRemove()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="form-label">Receipt Image (Optional)</label>
      
      {currentImageUrl ? (
        <div className="relative">
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Receipt Image</span>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <img
                src={currentImageUrl.startsWith('http') ? currentImageUrl : `http://localhost:3001${currentImageUrl}`}
                alt="Receipt"
                className="max-w-full max-h-48 object-contain rounded border"
                onError={() => {
                  console.error('Image failed to load:', currentImageUrl)
                  console.error('Constructed URL:', currentImageUrl.startsWith('http') ? currentImageUrl : `http://localhost:3001${currentImageUrl}`)
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!uploading ? handleClick : undefined}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin mx-auto w-8 h-8">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center space-x-2">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drop receipt image here or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, WebP, or HEIC up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}

export default ImageUpload
