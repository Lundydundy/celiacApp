import { useState, useEffect } from 'react'
import { Calculator, Calendar, Receipt as ReceiptIcon, Stethoscope, TrendingUp, FileText, Save, CheckCircle } from 'lucide-react'
import Navigation from '../components/Navigation'
import { taxAPI, receiptsAPI, medicalAPI } from '../services/api'
import type { TaxSummary as TaxSummaryType, Receipt, MedicalExpense } from '../types'

const TaxSummary = () => {
  const [taxSummary, setTaxSummary] = useState<TaxSummaryType | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [medicalExpenses, setMedicalExpenses] = useState<MedicalExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [netIncome, setNetIncome] = useState<string>('')
  const [dependantIncome, setDependantIncome] = useState<string>('')
  const [claimingFor, setClaimingFor] = useState<'self' | 'dependant'>('self')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    loadTaxData()
    loadTaxProfile()
  }, [selectedYear])

  const loadTaxProfile = async () => {
    try {
      const profile = await taxAPI.getTaxProfile(selectedYear)
      setNetIncome(profile.netIncome?.toString() || '')
      setDependantIncome(profile.dependantIncome?.toString() || '')
      setClaimingFor(profile.claimingFor as 'self' | 'dependant')
    } catch (error) {
      // Profile doesn't exist yet, that's okay
      console.log('No tax profile found for year:', selectedYear)
    }
  }

  const saveTaxProfile = async () => {
    try {
      setSaving(true)
      await taxAPI.saveTaxProfile({
        year: selectedYear,
        netIncome: netIncome ? parseFloat(netIncome) : undefined,
        dependantIncome: dependantIncome ? parseFloat(dependantIncome) : undefined,
        claimingFor: claimingFor
      })
      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to save tax profile:', error)
      alert('Failed to save income information. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  const loadTaxData = async () => {
    setLoading(true)
    try {
      const [summary, receiptsData, medicalData] = await Promise.all([
        taxAPI.getSummary(selectedYear),
        receiptsAPI.getAll(),
        medicalAPI.getAll(),
      ])
      
      setTaxSummary(summary)
        // Filter data by selected year
      const yearReceipts = receiptsData.filter(receipt => 
        new Date(receipt.receiptDate).getFullYear() === selectedYear
      )
      const yearMedical = medicalData.filter(expense => 
        new Date(expense.date).getFullYear() === selectedYear
      )
      
      setReceipts(yearReceipts)
      setMedicalExpenses(yearMedical)
    } catch (error) {
      console.error('Failed to load tax data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate the actual deductible amount based on Canadian tax rules
  const calculateActualDeduction = () => {
    const totalEligibleExpenses = (taxSummary?.totalDeductible || 0)
    const incomeToUse = claimingFor === 'self' ? parseFloat(netIncome || '0') : parseFloat(dependantIncome || '0')
    
    if (totalEligibleExpenses === 0) return 0
    
    const threePercentOfIncome = incomeToUse * 0.03
    const threshold = Math.min(2759, threePercentOfIncome)
    
    return Math.max(0, totalEligibleExpenses - threshold)
  }

  const getThresholdAmount = () => {
    const incomeToUse = claimingFor === 'self' ? parseFloat(netIncome || '0') : parseFloat(dependantIncome || '0')
    const threePercentOfIncome = incomeToUse * 0.03
    return Math.min(2759, threePercentOfIncome)
  }

  const generateJSONReport = () => {
    // In a real app, this would generate a PDF or downloadable report
    const reportData = {
      year: selectedYear,
      summary: taxSummary,      receipts: receipts.map(r => ({
        store: r.storeName,
        date: r.receiptDate,
        total: r.totalAmount,
        eligible: r.eligibleAmount,
      })),
      medicalExpenses: medicalExpenses.map(m => ({
        description: m.description,
        date: m.date,
        amount: m.amount,
        category: m.category,
        provider: m.provider,
      })),
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `celiac-tax-summary-${selectedYear}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthReceipts = receipts.filter(r => new Date(r.receiptDate).getMonth() + 1 === month)
    const monthMedical = medicalExpenses.filter(m => new Date(m.date).getMonth() + 1 === month)
    
    return {
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      receipts: monthReceipts.reduce((sum, r) => sum + r.eligibleAmount, 0),
      medical: monthMedical.reduce((sum, m) => sum + m.amount, 0),
      total: monthReceipts.reduce((sum, r) => sum + r.eligibleAmount, 0) + 
             monthMedical.reduce((sum, m) => sum + m.amount, 0),
    }
  })

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Summary</h1>
            <p className="text-gray-600">Review your celiac-related tax deductions</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-input"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={generateJSONReport}
                disabled={loading}
                className="btn-secondary flex items-center"
              >
                <FileText className="w-5 h-5 mr-2" />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deductible</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(taxSummary?.totalDeductible || 0).toFixed(2)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Tax savings potential</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eligible Receipts</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(taxSummary?.totalEligibleAmount || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {taxSummary?.receiptsCount || 0} receipts
                </p>
              </div>              <div className="p-3 bg-blue-50 rounded-xl">
                <ReceiptIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Expenses</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(taxSummary?.totalMedicalExpenses || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {taxSummary?.medicalExpensesCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tax Year</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Reporting period
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>        </div>

        {/* Income Input and Final Calculation */}
        <div className="mb-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Deduction Calculator</h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter your net income to calculate the actual deductible amount based on Canadian tax rules.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claiming expenses for:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="self"
                        checked={claimingFor === 'self'}
                        onChange={(e) => setClaimingFor(e.target.value as 'self' | 'dependant')}
                        className="mr-2"
                      />
                      Yourself (Line 33099)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="dependant"
                        checked={claimingFor === 'dependant'}
                        onChange={(e) => setClaimingFor(e.target.value as 'self' | 'dependant')}
                        className="mr-2"
                      />
                      Dependant (Line 33199)
                    </label>
                  </div>
                </div>

                {claimingFor === 'self' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Net Income (Line 23600)
                    </label>
                    <input
                      type="number"
                      value={netIncome}
                      onChange={(e) => setNetIncome(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your net income"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dependant's Net Income (Line 23600)
                    </label>
                    <input
                      type="number"
                      value={dependantIncome}
                      onChange={(e) => setDependantIncome(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter dependant's net income"
                    />
                  </div>                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={saveTaxProfile}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Income Info'}
                  </button>
                  
                  {lastSaved && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      Saved at {lastSaved}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                  <p className="text-sm text-blue-700">
                    You can claim eligible expenses minus the lesser of $2,759 or 3% of net income.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Your income information is saved automatically for future reference.
                  </p>
                </div>
              </div>

              {/* Calculation Results */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Calculation Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Eligible Expenses:</span>
                      <span className="font-medium">${(taxSummary?.totalDeductible || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>3% of Net Income:</span>
                      <span className="font-medium">
                        ${((claimingFor === 'self' ? parseFloat(netIncome || '0') : parseFloat(dependantIncome || '0')) * 0.03).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Threshold (Lesser of $2,759 or 3%):</span>
                      <span className="font-medium">${getThresholdAmount().toFixed(2)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Actual Deductible Amount:</span>
                      <span className="text-green-600">${calculateActualDeduction().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Final Tax Deduction</h4>
                  <p className="text-3xl font-bold text-green-900">
                    ${calculateActualDeduction().toFixed(2)}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Amount you can claim on {claimingFor === 'self' ? 'Line 33099' : 'Line 33199'}
                  </p>
                </div>

                {calculateActualDeduction() === 0 && (netIncome || dependantIncome) && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      Your eligible expenses don't exceed the threshold. You may not be able to claim these expenses this year.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Breakdown Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-12">
                    {data.month}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="flex h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500" 
                        style={{ 
                          width: `${Math.max((data.receipts / Math.max(...monthlyData.map(m => m.total))) * 100, 2)}%` 
                        }}
                      />
                      <div 
                        className="bg-purple-500" 
                        style={{ 
                          width: `${Math.max((data.medical / Math.max(...monthlyData.map(m => m.total))) * 100, 2)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    ${data.total.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Receipts</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Medical</span>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Gluten-Free Food Deduction</h4>
                <p className="text-sm text-blue-700 mb-2">
                  The excess cost of gluten-free food over regular food may be deductible as a medical expense.
                </p>
                <p className="text-lg font-semibold text-blue-900">
                  ${(taxSummary?.totalEligibleAmount || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Medical Expenses</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Medical expenses related to celiac disease diagnosis and treatment.
                </p>
                <p className="text-lg font-semibold text-purple-900">
                  ${(taxSummary?.totalMedicalExpenses || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Total Potential Deduction</h4>
                <p className="text-sm text-green-700 mb-2">
                  Combined total for tax year {selectedYear}
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ${(taxSummary?.totalDeductible || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {receipts.length} Receipts
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  {medicalExpenses.length} Medical
                </span>
              </div>
            </div>            <div className="space-y-3">
              {[...receipts.slice(0, 3), ...medicalExpenses.slice(0, 3)]
                .sort((a, b) => {
                  const dateA = 'receiptDate' in a ? a.receiptDate : a.date;
                  const dateB = 'receiptDate' in b ? b.receiptDate : b.date;
                  return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
                })
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        'storeName' in item ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {'storeName' in item ? (
                          <ReceiptIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Stethoscope className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {'storeName' in item ? item.storeName : item.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(() => {
                            const date = 'receiptDate' in item ? item.receiptDate : item.date;
                            return date ? new Date(date).toLocaleDateString() : 'N/A';
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${'eligibleAmount' in item ? (item.eligibleAmount || 0).toFixed(2) : (item.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {'storeName' in item ? 'Receipt' : 'Medical'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {receipts.length === 0 && medicalExpenses.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions for {selectedYear}</p>
                <p className="text-sm text-gray-500">Add receipts and medical expenses to see them here</p>
              </div>
            )}
          </div>
        </div>        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Tax Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This summary is for informational purposes only. Please consult with a qualified tax professional 
                  or refer to Canada Revenue Agency (CRA) guidelines for specific rules regarding medical expense 
                  deductions for celiac disease. The calculation is based on 2024 tax year rules and thresholds may 
                  change annually. Always verify current rates and eligibility criteria with the CRA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaxSummary
