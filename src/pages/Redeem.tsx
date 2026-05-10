import { useState } from 'react'
import { redeemCodeApi } from '../mock/redeemCodes'
import { RedeemResponse } from '../types'
import { formatRedeemCodeInput, validateRedeemCodeFormat } from '../utils/serialNumber'
import { Gift, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function Redeem() {
  // 表单状态
  const [redeemCode, setRedeemCode] = useState('')
  const [machineCode, setMachineCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [error, setError] = useState('')

  // 兑换结果
  const [redeemResult, setRedeemResult] = useState<RedeemResponse['data'] | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // 处理兑换码输入（自动格式化）
  const handleRedeemCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRedeemCodeInput(e.target.value)
    setRedeemCode(formatted)
  }

  // 处理兑换
  const handleRedeem = async () => {
    // 验证兑换码格式
    if (!validateRedeemCodeFormat(redeemCode)) {
      setError('兑换码格式不正确，应为 XXXX-XXXX-XXXX-XXXX')
      return
    }

    // 验证机器码
    if (!machineCode.trim()) {
      setError('请输入机器码')
      return
    }

    setError('')
    setIsRedeeming(true)

    try {
      const response: RedeemResponse = await redeemCodeApi.redeem({
        redeem_code: redeemCode,
        machine_code: machineCode.trim(),
      })

      if (response.success && response.data) {
        setRedeemResult(response.data)
        setShowResult(true)
      } else {
        setError(response.error || '兑换失败')
      }
    } catch (err) {
      setError('兑换过程中发生错误')
    } finally {
      setIsRedeeming(false)
    }
  }

  // 复制序列号
  const handleCopySerial = async () => {
    if (!redeemResult?.serial_number) return

    try {
      await navigator.clipboard.writeText(redeemResult.serial_number)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = redeemResult.serial_number
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  // 重新兑换
  const handleReset = () => {
    setShowResult(false)
    setRedeemResult(null)
    setRedeemCode('')
    setMachineCode('')
    setError('')
  }

  // 获取有效期显示文本
  const getExpiryText = () => {
    if (!redeemResult) return ''
    if (redeemResult.type === 'lifetime') {
      return '终身有效'
    }
    if (redeemResult.expires_at) {
      const date = new Date(redeemResult.expires_at)
      return `有效期至：${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
    return ''
  }

  // 获取类型显示文本
  const getTypeText = () => {
    if (!redeemResult) return ''
    const typeMap: Record<string, string> = {
      '6m': '6个月',
      '1y': '1年',
      'lifetime': '终身',
    }
    return typeMap[redeemResult.type] || redeemResult.type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/标题区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">序列号兑换</h1>
          <p className="text-gray-600 mt-2">输入兑换码获取您的序列号</p>
        </div>

        {!showResult ? (
          /* 兑换表单 */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {/* 兑换码输入 */}
              <div>
                <label htmlFor="redeemCode" className="block text-sm font-medium text-gray-700 mb-2">
                  兑换码
                </label>
                <input
                  id="redeemCode"
                  type="text"
                  value={redeemCode}
                  onChange={handleRedeemCodeChange}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-wider uppercase"
                  maxLength={19}
                />
                <p className="mt-1 text-xs text-gray-500 text-center">
                  16位字母数字，格式：XXXX-XXXX-XXXX-XXXX
                </p>
              </div>

              {/* 机器码输入 */}
              <div>
                <label htmlFor="machineCode" className="block text-sm font-medium text-gray-700 mb-2">
                  机器码
                </label>
                <input
                  id="machineCode"
                  type="text"
                  value={machineCode}
                  onChange={(e) => setMachineCode(e.target.value)}
                  placeholder="请输入您的机器码"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  机器码用于绑定序列号到您的设备
                </p>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* 兑换按钮 */}
              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemCode || !machineCode.trim()}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRedeeming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    兑换中...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    立即兑换
                  </>
                )}
              </button>
            </div>

            {/* 说明信息 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">兑换说明：</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• 每个兑换码最多可兑换 3 次</li>
                <li>• 兑换后序列号将绑定到您的机器码</li>
                <li>• 请妥善保管您的序列号</li>
              </ul>
            </div>
          </div>
        ) : (
          /* 兑换结果 */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* 成功提示 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">兑换成功！</h2>
              <p className="text-gray-600 mt-1">您的序列号已生成</p>
            </div>

            {/* 序列号卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                您的序列号
              </label>
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <p className="font-mono text-lg text-center text-gray-900 tracking-wider">
                  {redeemResult?.serial_number}
                </p>
              </div>

              {/* 复制按钮 */}
              <button
                onClick={handleCopySerial}
                className="w-full mt-3 inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    复制序列号
                  </>
                )}
              </button>
            </div>

            {/* 有效期信息 */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">有效期类型</span>
                <span className="font-medium text-gray-900">{getTypeText()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">有效期</span>
                <span className="font-medium text-gray-900">{getExpiryText()}</span>
              </div>
            </div>

            {/* 重新兑换按钮 */}
            <button
              onClick={handleReset}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              继续兑换
            </button>

            {/* 提示 */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              请妥善保存您的序列号，页面关闭后将无法再次查看
            </p>
          </div>
        )}

        {/* 底部链接 */}
        <div className="text-center mt-8">
          <a
            href="/admin/login"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            管理员登录 →
          </a>
        </div>
      </div>
    </div>
  )
}
