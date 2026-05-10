interface ExportConfirmModalProps {
  isOpen: boolean
  selectedCount: number
  alreadyExportedCount: number
  onConfirm: () => void
  onCancel: () => void
}

export default function ExportConfirmModal({
  isOpen,
  selectedCount,
  alreadyExportedCount,
  onConfirm,
  onCancel,
}: ExportConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                  确认导出
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    本次导出 <span className="font-semibold text-gray-900">{selectedCount}</span> 个兑换码
                    {alreadyExportedCount > 0 && (
                      <>
                        ，其中 <span className="font-semibold text-yellow-600">{alreadyExportedCount}</span> 个已导出过
                      </>
                    )}
                    ，是否继续？
                  </p>
                  {alreadyExportedCount > 0 && (
                    <p className="mt-2 text-xs text-yellow-600">
                      注意：重复导出可能导致兑换码被重复使用，请确认是否继续。
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
            >
              确认导出
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
