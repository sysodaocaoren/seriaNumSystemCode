import type {
  BatchGenerateParams,
  BatchGenerateResponse,
  DisableResponse,
  ExportResponse,
  RedeemCodeDetailResponse,
  RedeemCodeFilterParams,
  RedeemCodeListResponse,
  RedeemParams,
  RedeemResponse,
} from '../types'

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  const payload = await response.json().catch(() => ({}))
  return payload as T
}

function toQuery(params: RedeemCodeFilterParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page || 1))
  search.set('pageSize', String(params.pageSize || 20))
  if (params.status) search.set('status', String(params.status))
  if (params.type) search.set('type', String(params.type))
  if (params.exported !== undefined) search.set('exported', String(params.exported))
  if (params.sortOrder) search.set('sortOrder', params.sortOrder)
  return search.toString()
}

export const redeemCodeApi = {
  getList: async (params: RedeemCodeFilterParams): Promise<RedeemCodeListResponse> => {
    return request<RedeemCodeListResponse>(`/api/redeem-codes?${toQuery(params)}`)
  },

  getDetail: async (id: string): Promise<RedeemCodeDetailResponse> => {
    return request<RedeemCodeDetailResponse>(`/api/redeem-codes/${encodeURIComponent(id)}`)
  },

  export: async (ids: string[]): Promise<ExportResponse> => {
    return request<ExportResponse>('/api/redeem-codes/export', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  disable: async (id: string): Promise<DisableResponse> => {
    return request<DisableResponse>(`/api/redeem-codes/${encodeURIComponent(id)}/disable`, {
      method: 'PUT',
    })
  },

  batchGenerate: async (params: BatchGenerateParams): Promise<BatchGenerateResponse> => {
    return request<BatchGenerateResponse>('/api/redeem-codes/batch-generate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  redeem: async (params: RedeemParams): Promise<RedeemResponse> => {
    return request<RedeemResponse>('/api/redeem', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
}
