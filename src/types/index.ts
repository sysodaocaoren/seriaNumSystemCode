export type RedeemCodeType = '6m' | '1y' | 'lifetime'
export type RedeemCodeStatus = 'unused' | 'used' | 'disabled'

export interface RedeemCode {
  id: string
  code: string
  type: RedeemCodeType
  status: RedeemCodeStatus
  exported: boolean
  used_count: number
  first_redeemed_at?: string
  created_at: string
}

export interface RedeemRecord {
  serial_number: string
  machine_code: string
  redeemed_at: string
}

export interface RedeemCodeDetail extends RedeemCode {
  records: RedeemRecord[]
}

export interface RedeemCodeFilterParams {
  page: number
  pageSize: number
  status?: RedeemCodeStatus | 'all'
  type?: RedeemCodeType | 'all'
  exported?: boolean | 'all'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface RedeemCodeListResponse {
  success: boolean
  data: {
    list: RedeemCode[]
    total: number
    page: number
    pageSize: number
  }
}

export interface ExportResponse {
  success: boolean
  data?: {
    codes: string[]
    exportedCount: number
    alreadyExportedCount: number
  }
  error?: string
}

export interface RedeemCodeDetailResponse {
  success: boolean
  data?: RedeemCodeDetail
  error?: string
}

export interface DisableResponse {
  success: boolean
  error?: string
}

// 批量生成相关类型
export interface BatchGenerateParams {
  type: RedeemCodeType
  count: number
}

export interface BatchGenerateResponse {
  success: boolean
  data?: {
    codes: RedeemCode[]
    generatedCount: number
  }
  error?: string
}

// 兑换相关类型
export interface RedeemParams {
  redeem_code: string
  machine_code: string
}

export interface RedeemResponse {
  success: boolean
  data?: {
    serial_number: string
    expires_at?: string
    type: RedeemCodeType
  }
  error?: string
}
