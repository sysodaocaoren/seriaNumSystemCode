import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Copy, Gift, RefreshCw } from 'lucide-react'
import { redeemCodeApi } from '../mock/redeemCodes'
import type { RedeemCodeLookupResponse, RedeemResponse } from '../types'
import { formatRedeemCodeInput, validateRedeemCodeFormat } from '../utils/serialNumber'

const MAX_REDEEM_USES = 10

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

function formatDateText(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function getTypeText(type?: string) {
  const typeMap: Record<string, string> = {
    '6m': '6个月',
    '1y': '1年',
    lifetime: '终身',
  }
  return type ? typeMap[type] || type : ''
}

function buildLookupMessage(lookup: RedeemCodeLookupResponse | null) {
  if (!lookup) return ''
  if (!lookup.success || !lookup.data) {
    return lookup.error || ''
  }

  const { type, remaining_uses, first_redeemed_at, expires_at, status } = lookup.data
  const startText = first_redeemed_at
    ? `首次兑换时间为 ${formatDateText(first_redeemed_at)}`
    : '该兑换码尚未开始使用，首次兑换后开始计时'
  const expiryText =
    type === 'lifetime'
      ? '终身有效，无截止时间'
      : expires_at
        ? `截止时间为 ${formatDateText(expires_at)}`
        : '截止时间将在首次兑换后按有效期自动计算'
  const statusText = status === 'disabled' ? '当前状态为已禁用' : `当前还可兑换 ${remaining_uses} 次（每个兑换码最多 ${MAX_REDEEM_USES} 次）`

  return `兑换码存在，类型为${getTypeText(type)}，${statusText}；${startText}，${expiryText}。`
}

export default function Redeem() {
  const [redeemCode, setRedeemCode] = useState('')
  const [machineCode, setMachineCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [error, setError] = useState('')
  const [lookupResult, setLookupResult] = useState<RedeemCodeLookupResponse | null>(null)
  const [redeemResult, setRedeemResult] = useState<RedeemResponse['data'] | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const lookupMessage = useMemo(() => buildLookupMessage(lookupResult), [lookupResult])

  useEffect(() => {
    if (!redeemCode || !validateRedeemCodeFormat(redeemCode)) {
      setLookupResult(null)
      setIsLookingUp(false)
      return
    }

    let active = true
    setIsLookingUp(true)
    const timer = setTimeout(async () => {
      try {
        const result = await redeemCodeApi.lookup(redeemCode)
        if (active) {
          setLookupResult(result)
        }
      } catch {
        if (active) {
          setLookupResult({ success: false, error: '兑换码信息查询失败，请稍后重试' })
        }
      } finally {
        if (active) {
          setIsLookingUp(false)
        }
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [redeemCode])

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
    setLookupResult(null)
  }

  const getExpiryText = () => {
    if (!redeemResult) return ''
    if (redeemResult.type === 'lifetime') return '终身有效'
    return redeemResult.expires_at ? `有效期至：${formatDateText(redeemResult.expires_at)}` : ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CreateNow 序列号兑换</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            这是 CreateNow 软件专用的兑换入口。输入兑换码和机器码后，即可生成当前设备可用的序列号。
          </p>
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
                <div className="mt-2 min-h-11 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                  {isLookingUp
                    ? '正在查询兑换码信息...'
                    : lookupMessage || `每个兑换码最多可兑换 ${MAX_REDEEM_USES} 次，首次兑换时间即为开始使用时间。`}
                </div>
              </div>

              <div>
                <label htmlFor="machineCode" className="mb-2 block text-sm font-medium text-gray-700">
                  机器码
                </label>
                <textarea
                  id="machineCode"
                  value={machineCode}
                  onChange={(event) => setMachineCode(event.target.value)}
                  placeholder="请输入当前 CreateNow 软件显示的机器码"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-gray-500">序列号会绑定到当前机器码，请确认与 CreateNow 中显示的一致。</p>
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
                    立即兑换序列号
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">兑换成功</h2>
              <p className="mt-2 text-sm text-gray-600">这是当前 CreateNow 设备可用的序列号，请及时复制保存。</p>
            </div>

            <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">您的序列号</p>
                  <p className="mt-1 text-xs text-gray-500">复制后可直接用于 CreateNow 激活</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                  {getTypeText(redeemResult?.type)}
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
                <span className="font-medium text-gray-900">{getTypeText(redeemResult?.type)}</span>
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
          </div>
        )}
      </div>
    </div>
  )
}
