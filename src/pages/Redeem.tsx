import { useState } from 'react'
import { AlertCircle, CheckCircle, Copy, Gift, RefreshCw } from 'lucide-react'
import { redeemCodeApi } from '../mock/redeemCodes'
import type { RedeemResponse } from '../types'
import { formatRedeemCodeInput, validateRedeemCodeFormat } from '../utils/serialNumber'

function formatSerialForDisplay(serialNumber?: string): string {
  if (!serialNumber) return ''
  const compact = serialNumber.trim()
  if (!compact.startsWith('SN1.')) {
    return compact.match(/.{1,16}/g)?.join('\n') || compact
  }

  const prefix = 'SN1.'
  const payload = compact.slice(prefix.length)
  const lines = payload.match(/.{1,16}/g) || []
  return `${prefix}\n${lines.join('\n')}`
}

export default function Redeem() {
  const [redeemCode, setRedeemCode] = useState('')
  const [machineCode, setMachineCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [error, setError] = useState('')
  const [redeemResult, setRedeemResult] = useState<RedeemResponse['data'] | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleRedeemCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRedeemCode(formatRedeemCodeInput(event.target.value))
  }

  const handleRedeem = async () => {
    if (!validateRedeemCodeFormat(redeemCode)) {
      setError('兑换码格式不正确，应为 XXXX-XXXX-XXXX-XXXX')
      return
    }

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
    } catch {
      setError('兑换过程中发生错误')
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleCopySerial = async () => {
    if (!redeemResult?.serial_number) return

    try {
      await navigator.clipboard.writeText(redeemResult.serial_number)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
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

  const handleReset = () => {
    setShowResult(false)
    setRedeemResult(null)
    setRedeemCode('')
    setMachineCode('')
    setError('')
  }

  const getExpiryText = () => {
    if (!redeemResult) return ''
    if (redeemResult.type === 'lifetime') return '终身有效'
    if (!redeemResult.expires_at) return ''

    const date = new Date(redeemResult.expires_at)
    return `有效期至：${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getTypeText = () => {
    if (!redeemResult) return ''
    const typeMap: Record<string, string> = {
      '6m': '6个月',
      '1y': '1年',
      lifetime: '终身',
    }
    return typeMap[redeemResult.type] || redeemResult.type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">序列号兑换</h1>
          <p className="mt-2 text-sm text-gray-600">输入兑换码和机器码，立即生成可用序列号</p>
        </div>

        {!showResult ? (
          <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="redeemCode" className="mb-2 block text-sm font-medium text-gray-700">
                  兑换码
                </label>
                <input
                  id="redeemCode"
                  type="text"
                  value={redeemCode}
                  onChange={handleRedeemCodeChange}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.2em] text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  maxLength={19}
                />
                <p className="mt-2 text-center text-xs text-gray-500">
                  请输入 16 位兑换码，系统会自动格式化
                </p>
              </div>

              <div>
                <label htmlFor="machineCode" className="mb-2 block text-sm font-medium text-gray-700">
                  机器码
                </label>
                <textarea
                  id="machineCode"
                  value={machineCode}
                  onChange={(event) => setMachineCode(event.target.value)}
                  placeholder="请输入您的机器码"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-gray-500">机器码用于将序列号绑定到当前设备</p>
              </div>

              {error ? (
                <div className="flex items-start rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
                  <p className="text-sm leading-6 text-red-700">{error}</p>
                </div>
              ) : null}

              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemCode || !machineCode.trim()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRedeeming ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    正在兑换...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-5 w-5" />
                    立即兑换
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-700">兑换说明</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li>每个兑换码最多可兑换 3 次。</li>
                <li>兑换后的序列号会绑定到当前机器码。</li>
                <li>请在兑换成功后及时复制并保存序列号。</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">兑换成功</h2>
              <p className="mt-2 text-sm text-gray-600">您的序列号已生成，请及时复制保存</p>
            </div>

            <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">您的序列号</p>
                  <p className="mt-1 text-xs text-gray-500">已优化为适合长串查看的展示方式</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                  {getTypeText()}
                </span>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-slate-950 p-4 shadow-inner">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm leading-7 text-blue-50 sm:text-[15px]">
                  {formatSerialForDisplay(redeemResult?.serial_number)}
                </pre>
              </div>

              <button
                onClick={handleCopySerial}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    已复制到剪贴板
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    复制完整序列号
                  </>
                )}
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between border-b border-gray-200 py-2 text-sm">
                <span className="text-gray-500">授权类型</span>
                <span className="font-medium text-gray-900">{getTypeText()}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-500">有效期</span>
                <span className="pl-4 text-right font-medium text-gray-900">{getExpiryText()}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              继续兑换
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-gray-500">
              请妥善保存您的序列号，关闭页面后将无法再次直接查看本次结果。
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/admin/login" className="text-sm text-gray-500 transition hover:text-gray-700">
            管理员登录 →
          </a>
        </div>
      </div>
    </div>
  )
}
