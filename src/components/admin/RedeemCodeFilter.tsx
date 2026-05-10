import { RedeemCodeType, RedeemCodeStatus } from '../../types'

interface RedeemCodeFilterProps {
  statusFilter: RedeemCodeStatus | 'all'
  typeFilter: RedeemCodeType | 'all'
  exportedFilter: boolean | 'all'
  sortOrder: 'asc' | 'desc'
  onStatusChange: (status: RedeemCodeStatus | 'all') => void
  onTypeChange: (type: RedeemCodeType | 'all') => void
  onExportedChange: (exported: boolean | 'all') => void
  onSortOrderChange: (order: 'asc' | 'desc') => void
  onRefresh: () => void
}

const statusOptions: Array<{ value: RedeemCodeStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'unused', label: '未使用' },
  { value: 'used', label: '已使用' },
  { value: 'disabled', label: '已禁用' },
]

const typeOptions: Array<{ value: RedeemCodeType | 'all'; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: '6m', label: '6个月' },
  { value: '1y', label: '1年' },
  { value: 'lifetime', label: '终身' },
]

const exportedOptions: Array<{ value: boolean | 'all'; label: string }> = [
  { value: 'all', label: '全部导出状态' },
  { value: true, label: '已导出' },
  { value: false, label: '未导出' },
]

export default function RedeemCodeFilter({
  statusFilter,
  typeFilter,
  exportedFilter,
  sortOrder,
  onStatusChange,
  onTypeChange,
  onExportedChange,
  onSortOrderChange,
  onRefresh,
}: RedeemCodeFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* 使用状态筛选 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">使用状态:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as RedeemCodeStatus | 'all')}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">有效期:</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value as RedeemCodeType | 'all')}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* 导出状态筛选 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">导出状态:</label>
          <select
            value={String(exportedFilter)}
            onChange={(e) => {
              const value = e.target.value
              if (value === 'all') {
                onExportedChange('all')
              } else {
                onExportedChange(value === 'true')
              }
            }}
            className="block w-36 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            {exportedOptions.map(option => (
              <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">排序:</label>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            生成时间 {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* 刷新按钮 */}
        <div className="ml-auto">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            刷新
          </button>
        </div>
      </div>
    </div>
  )
}
