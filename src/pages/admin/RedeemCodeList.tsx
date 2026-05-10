import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.tsx'
import { redeemCodeApi } from '../../mock/redeemCodes'
import { exportRedeemCodesToText } from '../../utils/export'
import { RedeemCode, RedeemCodeType, RedeemCodeStatus, RedeemCodeDetail } from '../../types'
import RedeemCodeFilter from '../../components/admin/RedeemCodeFilter'
import RedeemCodeTable from '../../components/admin/RedeemCodeTable'
import ExportConfirmModal from '../../components/admin/ExportConfirmModal'
import RedeemCodeDetailModal from '../../components/admin/RedeemCodeDetailModal'
import DisableConfirmModal from '../../components/admin/DisableConfirmModal'

export default function RedeemCodeList() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  
  // 列表数据
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  
  // 筛选条件
  const [statusFilter, setStatusFilter] = useState<RedeemCodeStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<RedeemCodeType | 'all'>('all')
  const [exportedFilter, setExportedFilter] = useState<boolean | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 选中项
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // 弹窗状态
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<RedeemCode | null>(null)
  const [detailData, setDetailData] = useState<RedeemCodeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // 导出统计
  const [exportStats, setExportStats] = useState({ selectedCount: 0, alreadyExportedCount: 0 })

  // 加载列表数据
  const loadCodes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await redeemCodeApi.getList({
        page,
        pageSize,
        status: statusFilter,
        type: typeFilter,
        exported: exportedFilter,
        sortOrder,
      })
      
      if (response.success) {
        setCodes(response.data.list)
        setTotal(response.data.total)
        // 清空选中项当页面变化时
        setSelectedIds([])
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, typeFilter, exportedFilter, sortOrder])

  // 初始加载
  useEffect(() => {
    loadCodes()
  }, [loadCodes])

  // 全选当前页
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(codes.map(code => code.id))
    } else {
      setSelectedIds([])
    }
  }

  // 单选
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  // 查看详情
  const handleViewDetail = async (code: RedeemCode) => {
    setSelectedCode(code)
    setIsDetailModalOpen(true)
    setDetailLoading(true)
    
    try {
      const response = await redeemCodeApi.getDetail(code.id)
      if (response.success && response.data) {
        setDetailData(response.data)
      }
    } finally {
      setDetailLoading(false)
    }
  }

  // 禁用兑换码
  const handleDisable = (code: RedeemCode) => {
    setSelectedCode(code)
    setIsDisableModalOpen(true)
  }

  // 确认禁用
  const confirmDisable = async () => {
    if (!selectedCode) return
    
    const response = await redeemCodeApi.disable(selectedCode.id)
    if (response.success) {
      // 刷新列表
      loadCodes()
    }
    setIsDisableModalOpen(false)
    setSelectedCode(null)
  }

  // 点击导出按钮
  const handleExportClick = () => {
    if (selectedIds.length === 0) return
    
    // 统计已导出数量
    const selectedCodes = codes.filter(code => selectedIds.includes(code.id))
    const alreadyExportedCount = selectedCodes.filter(code => code.exported).length
    
    setExportStats({
      selectedCount: selectedIds.length,
      alreadyExportedCount,
    })
    setIsExportModalOpen(true)
  }

  // 确认导出
  const confirmExport = async () => {
    const response = await redeemCodeApi.export(selectedIds)
    
    if (response.success && response.data) {
      // 下载文件
      exportRedeemCodesToText(response.data.codes)
      
      // 刷新列表
      loadCodes()
    }
    
    setIsExportModalOpen(false)
  }

  // 总页数
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">兑换码管理</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/redeem-codes/generate')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              type="button"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              批量生成
            </button>
            <button
            onClick={() => {
              console.log('点击退出登录按钮')
              try {
                logout()
                console.log('logout 执行完成，准备导航到登录页')
                navigate('/admin/login', { replace: true })
              } catch (err) {
                console.error('退出登录失败:', err)
                // 即使出错也尝试导航
                navigate('/admin/login', { replace: true })
              }
            }}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            type="button"
          >
            退出登录
          </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选栏 */}
        <RedeemCodeFilter
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          exportedFilter={exportedFilter}
          sortOrder={sortOrder}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
          onExportedChange={setExportedFilter}
          onSortOrderChange={setSortOrder}
          onRefresh={loadCodes}
        />

        {/* 批量操作栏 */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 mb-4 flex items-center justify-between">
            <span className="text-sm text-indigo-900">
              已选择 <span className="font-semibold">{selectedIds.length}</span> 个兑换码
            </span>
            <button
              onClick={handleExportClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              导出选中项
            </button>
          </div>
        )}
        
        {/* 表格 */}
        <RedeemCodeTable
          codes={codes}
          selectedIds={selectedIds}
          loading={loading}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onViewDetail={handleViewDetail}
          onDisable={handleDisable}
        />

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              共 <span className="font-medium">{total}</span> 条记录，
              第 <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span> 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 导出确认弹窗 */}
      <ExportConfirmModal
        isOpen={isExportModalOpen}
        selectedCount={exportStats.selectedCount}
        alreadyExportedCount={exportStats.alreadyExportedCount}
        onConfirm={confirmExport}
        onCancel={() => setIsExportModalOpen(false)}
      />

      {/* 详情弹窗 */}
      <RedeemCodeDetailModal
        isOpen={isDetailModalOpen}
        detail={detailData}
        loading={detailLoading}
        onClose={() => {
          setIsDetailModalOpen(false)
          setDetailData(null)
          setSelectedCode(null)
        }}
      />

      {/* 禁用确认弹窗 */}
      <DisableConfirmModal
        isOpen={isDisableModalOpen}
        code={selectedCode}
        onConfirm={confirmDisable}
        onCancel={() => {
          setIsDisableModalOpen(false)
          setSelectedCode(null)
        }}
      />
    </div>
  )
}
