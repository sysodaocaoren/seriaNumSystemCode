import { RedeemCodeDetail } from '../../types'
import { X } from 'lucide-react'

interface RedeemCodeDetailModalProps {
  isOpen: boolean
  detail: RedeemCodeDetail | null
  loading: boolean
  onClose: () => void
}

const typeLabels: Record<string, string> = {
  '6m': '6个月',
  '1y': '1年',
  'lifetime': '终身',
}

const statusLabels: Record<string, { label: string; className: string }> = {
  'unused': { label: '未使用', className: 'bg-green-100 text-green-800' },
  'used': { label: '已使用', className: 'bg-blue-100 text-blue-800' },
  'disabled': { label: '已禁用', className: 'bg-gray-100 text-gray-800' },
}

export default function RedeemCodeDetailModal({
  isOpen,
  detail,
  loading,
  onClose,
}: RedeemCodeDetailModalProps) {
  if (!isOpen) return null

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* 头部 */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              兑换码详情
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 内容 */}
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : detail ? (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">兑换码</dt>
                      <dd className="mt-1">
                        <code className="text-lg font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded block">
                          {detail.code}
                        </code>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">类型</dt>
                      <dd className="mt-1 text-sm text-gray-900">{typeLabels[detail.type] || detail.type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">使用状态</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[detail.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[detail.status]?.label || detail.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">导出状态</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          detail.exported 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {detail.exported ? '已导出' : '未导出'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">已兑换次数</dt>
                      <dd className="mt-1 text-sm text-gray-900">{detail.used_count}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">首次兑换时间</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(detail.first_redeemed_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">生成时间</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(detail.created_at)}</dd>
                    </div>
                  </dl>
                </div>

                {/* 兑换记录 */}
                {detail.records && detail.records.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">兑换记录</h4>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
                              序列号
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              机器码
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              兑换时间
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {detail.records.map((record, index) => (
                            <tr key={index}>
                              <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs font-mono text-gray-900 sm:pl-6">
                                {record.serial_number}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs font-mono text-gray-500">
                                {record.machine_code}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                                {formatDate(record.redeemed_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detail.status !== 'used' && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    暂无兑换记录
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                无法加载详情
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
