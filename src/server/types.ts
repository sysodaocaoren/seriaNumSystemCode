import type {
  BatchGenerateParams,
  BatchGenerateResponse,
  DisableResponse,
  ExportResponse,
  RedeemCode,
  RedeemCodeDetail,
  RedeemCodeDetailResponse,
  RedeemCodeFilterParams,
  RedeemCodeListResponse,
  RedeemParams,
  RedeemRecord,
  RedeemResponse,
} from '../types'

export type RedeemStoreState = {
  codes: RedeemCode[]
  recordsByCodeId: Record<string, RedeemRecord[]>
}

export interface RedeemCodeRepository {
  list(params: RedeemCodeFilterParams): Promise<RedeemCodeListResponse>
  getDetail(id: string): Promise<RedeemCodeDetailResponse>
  exportCodes(ids: string[]): Promise<ExportResponse>
  disable(id: string): Promise<DisableResponse>
  batchGenerate(params: BatchGenerateParams): Promise<BatchGenerateResponse>
  redeem(params: RedeemParams): Promise<RedeemResponse>
}

export type ApiResult = {
  status: number
  body: unknown
}

export type RedeemCodeDetailRecord = RedeemCodeDetail
