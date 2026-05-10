import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.tsx'
import { redeemCodeApi } from '../../mock/redeemCodes'
import { exportRedeemCodesToText } from '../../utils/export'
import { RedeemCode, BatchGenerateResponse } from '../../types'
import { Copy, Download, Plus, ArrowLeft, CheckCircle } from 'lucide-react'

type GenerateType = '6m' | '1y' | 'lifetime'

export default function RedeemCodeGenerate() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  // 表单状态
  const [type, setType] = useState<GenerateType>('6m')
  const [count, setCount] = useState<number>(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  // 生成结果
  const [generatedCodes, setGeneratedCodes] = useState<RedeemCode[]>([])
  const [showResult, setShowResult] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // 类型选项
  const typeOptions: { value: GenerateType; label: string }[] = [
    { value: '6m', label: '6个月' },
    { value: '1y', label: '1年' },
    { value: 'lifetime', label: '终身' },
  ]

  // 处理数量输入
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (isNaN(value)) {
      setCount(0)
    } else {
      setCount(Math.min(Math.max(value, 1), 1000))
    }
  }

  // 生成兑换码
  const handleGenerate = async () => {
    if (count < 1 || count > 1000) {
      setError('生成数量必须在 1-1000 之间')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      const response: BatchGenerateResponse = await redeemCodeApi.batchGenerate({
        type,
        count,
      })

      if (response.success && response.data) {
        setGeneratedCodes(response.data.codes)
        setShowResult(true)
      } else {
        setError(response.error || '生成失败')
      }
    } catch (err) {
      setError('生成过程中发生错误')
    } finally {
      setIsGenerating(false)
    }
  }

  // 复制所有兑换码
  const handleCopyAll = async () => {
    const codesText = generatedCodes.map(c => c.code).join('\n')
    try {
      await navigator.clipboard.writeText(codesText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // 降级方案：创建临时文本区域
      const textarea = document.createElement('textarea')
      textarea.value = codesText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  // 导出为文本文件
  const handleExport = () => {
    const codes = generatedCodes.map(c => c.code)
    exportRedeemCodesToText(codes)
  }

  // 返回列表页
  const handleBack = () => {
    navigate('/admin/redeem-codes')
  }

  // 重新生成
  const handleReset = () => {
    setShowResult(false)
    setGeneratedCodes([])
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              返回列表
            </button>
            <h1 className="text-xl font-semibold text-gray-800">批量生成兑换码</h1>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/admin/login', { replace: true })
            }}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            type="button"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResult ? (
          /* 生成表单 */
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-6">生成配置</h2>

            <div className="space-y-6">
              {/* 有效期类型 */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  有效期类型
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as GenerateType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 生成数量 */}
              <div>
                <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                  生成数量 <span className="text-gray-400">(1-1000)</span>
                </label>
                <input
                  id="count"
                  type="number"
                  min={1}
                  max={1000}
                  value={count}
                  onChange={handleCountChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入生成数量"
                />
                <p className="mt-1 text-sm text-gray-500">
                  建议单次生成不超过 500 个，以保证生成速度
                </p>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 生成按钮 */}
              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || count < 1 || count > 1000}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      生成兑换码
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 生成结果 */
          <div className="space-y-6">
            {/* 成功提示 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="text-green-800 font-medium">
                  成功生成 {generatedCodes.length} 个兑换码
                </p>
                <p className="text-green-600 text-sm">
                  有效期类型：{typeOptions.find(t => t.value === type)?.label}
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copySuccess ? '已复制!' : '复制全部'}
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                导出文本文件
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                继续生成
              </button>
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ml-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回列表
              </button>
            </div>

            {/* 兑换码列表 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  生成的兑换码列表
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  共 {generatedCodes.length} 个兑换码，格式：XXXX-XXXX-XXXX-XXXX
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        序号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        兑换码
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        有效期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedCodes.map((code, index) => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {code.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {typeOptions.find(t => t.value === code.type)?.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            未使用
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
