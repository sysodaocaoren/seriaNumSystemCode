import type { BatchGenerateParams, RedeemCodeFilterParams, RedeemParams } from '../types'
import type { ApiResult, RedeemCodeRepository } from './types'

function json(status: number, body: unknown): ApiResult {
  return { status, body }
}

function parseBooleanFilter(value: string | null): boolean | 'all' | undefined {
  if (value === null || value === '') return undefined
  if (value === 'all') return 'all'
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export async function handleRedeemCodeApiRequest(input: {
  method: string
  pathname: string
  searchParams: URLSearchParams
  body: any
  repository: RedeemCodeRepository
}): Promise<ApiResult | null> {
  const { method, pathname, searchParams, body, repository } = input

  if (pathname === '/api/redeem-codes' && method === 'GET') {
    const params: RedeemCodeFilterParams = {
      page: Number(searchParams.get('page') || 1),
      pageSize: Number(searchParams.get('pageSize') || 20),
      status: (searchParams.get('status') as RedeemCodeFilterParams['status']) || 'all',
      type: (searchParams.get('type') as RedeemCodeFilterParams['type']) || 'all',
      exported: parseBooleanFilter(searchParams.get('exported')) || 'all',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }
    return json(200, await repository.list(params))
  }

  if (pathname === '/api/redeem-codes/batch-generate' && method === 'POST') {
    const payload = body as BatchGenerateParams
    return json(200, await repository.batchGenerate(payload))
  }

  if (pathname === '/api/redeem-codes/export' && method === 'POST') {
    const ids = Array.isArray(body?.ids) ? body.ids.map((item: unknown) => String(item)) : []
    return json(200, await repository.exportCodes(ids))
  }

  if (pathname.startsWith('/api/redeem-codes/') && pathname.endsWith('/disable') && method === 'PUT') {
    const id = pathname.replace('/api/redeem-codes/', '').replace('/disable', '').replace(/\//g, '')
    return json(200, await repository.disable(id))
  }

  if (pathname.startsWith('/api/redeem-codes/') && method === 'GET') {
    const id = pathname.replace('/api/redeem-codes/', '').replace(/\//g, '')
    return json(200, await repository.getDetail(id))
  }

  if (pathname === '/api/redeem' && method === 'POST') {
    const payload = body as RedeemParams
    return json(200, await repository.redeem(payload))
  }

  return null
}
