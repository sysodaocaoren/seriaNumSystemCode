import type {
  BatchGenerateParams,
  BatchGenerateResponse,
  DisableResponse,
  ExportResponse,
  RedeemCode,
  RedeemCodeDetailResponse,
  RedeemCodeFilterParams,
  RedeemCodeListResponse,
  RedeemCodeType,
  RedeemParams,
  RedeemResponse,
} from '../types'
import { generateSerialNumber } from '../utils/serialNumber'
import type { RedeemStoreState } from './types'

const EMPTY_STATE: RedeemStoreState = {
  codes: [],
  recordsByCodeId: {},
}

function cloneState(state?: RedeemStoreState): RedeemStoreState {
  if (!state) {
    return {
      codes: [],
      recordsByCodeId: {},
    }
  }

  return {
    codes: state.codes.map((code) => ({ ...code })),
    recordsByCodeId: Object.fromEntries(
      Object.entries(state.recordsByCodeId || {}).map(([key, records]) => [key, records.map((record) => ({ ...record }))]),
    ),
  }
}

function generateUniqueCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  while (true) {
    let code = ''
    for (let index = 0; index < 16; index += 1) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const formatted = code.match(/.{4}/g)?.join('-') || code
    if (!existingCodes.has(formatted)) {
      return formatted
    }
  }
}

export function createEmptyRedeemStoreState(): RedeemStoreState {
  return cloneState(EMPTY_STATE)
}

export function listCodesFromState(state: RedeemStoreState, params: RedeemCodeFilterParams): RedeemCodeListResponse {
  let filtered = [...state.codes]

  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((code) => code.status === params.status)
  }

  if (params.type && params.type !== 'all') {
    filtered = filtered.filter((code) => code.type === params.type)
  }

  if (params.exported !== undefined && params.exported !== 'all') {
    filtered = filtered.filter((code) => code.exported === params.exported)
  }

  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
  })

  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    success: true,
    data: {
      list: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    },
  }
}

export function getCodeDetailFromState(state: RedeemStoreState, id: string): RedeemCodeDetailResponse {
  const code = state.codes.find((item) => item.id === id)
  if (!code) {
    return { success: false, error: '兑换码不存在' }
  }

  return {
    success: true,
    data: {
      ...code,
      records: state.recordsByCodeId[id] || [],
    },
  }
}

export function exportCodesInState(state: RedeemStoreState, ids: string[]): { state: RedeemStoreState; response: ExportResponse } {
  const nextState = cloneState(state)
  const codes = nextState.codes.filter((item) => ids.includes(item.id))

  if (codes.length === 0) {
    return {
      state,
      response: { success: false, error: '未找到选中的兑换码' },
    }
  }

  const alreadyExportedCount = codes.filter((item) => item.exported).length
  codes.forEach((code) => {
    code.exported = true
  })

  return {
    state: nextState,
    response: {
      success: true,
      data: {
        codes: codes.map((item) => item.code),
        exportedCount: codes.length,
        alreadyExportedCount,
      },
    },
  }
}

export function disableCodeInState(state: RedeemStoreState, id: string): { state: RedeemStoreState; response: DisableResponse } {
  const nextState = cloneState(state)
  const code = nextState.codes.find((item) => item.id === id)

  if (!code) {
    return {
      state,
      response: { success: false, error: '兑换码不存在' },
    }
  }

  if (code.status === 'disabled') {
    return {
      state,
      response: { success: false, error: '兑换码已被禁用' },
    }
  }

  code.status = 'disabled'
  return {
    state: nextState,
    response: { success: true },
  }
}

export function batchGenerateInState(
  state: RedeemStoreState,
  params: BatchGenerateParams,
): { state: RedeemStoreState; response: BatchGenerateResponse } {
  const { count, type } = params
  if (count < 1 || count > 1000) {
    return {
      state,
      response: { success: false, error: '生成数量必须在 1-1000 之间' },
    }
  }

  const nextState = cloneState(state)
  const existingCodes = new Set(nextState.codes.map((item) => item.code))
  const createdAt = new Date().toISOString()
  const generatedCodes: RedeemCode[] = []

  for (let index = 0; index < count; index += 1) {
    const code = generateUniqueCode(existingCodes)
    existingCodes.add(code)

    const item: RedeemCode = {
      id: crypto.randomUUID(),
      code,
      type: type as RedeemCodeType,
      status: 'unused',
      exported: false,
      used_count: 0,
      created_at: createdAt,
    }

    nextState.codes.unshift(item)
    generatedCodes.push(item)
  }

  return {
    state: nextState,
    response: {
      success: true,
      data: {
        codes: generatedCodes,
        generatedCount: generatedCodes.length,
      },
    },
  }
}

export async function redeemInState(
  state: RedeemStoreState,
  params: RedeemParams,
): Promise<{ state: RedeemStoreState; response: RedeemResponse }> {
  const nextState = cloneState(state)
  const { redeem_code, machine_code } = params
  const code = nextState.codes.find((item) => item.code === redeem_code)

  if (!code) {
    return {
      state,
      response: { success: false, error: '兑换码无效' },
    }
  }

  if (code.status === 'disabled') {
    return {
      state,
      response: { success: false, error: '兑换码无效' },
    }
  }

  if (code.used_count >= 3) {
    return {
      state,
      response: { success: false, error: '兑换次数已用完' },
    }
  }

  const now = Date.now()
  let expiresAt: string | undefined

  if (code.type !== 'lifetime') {
    const firstRedeem = code.first_redeemed_at ? new Date(code.first_redeemed_at).getTime() : now
    const duration =
      code.type === '6m'
        ? 180 * 24 * 60 * 60 * 1000
        : 365 * 24 * 60 * 60 * 1000

    expiresAt = new Date(firstRedeem + duration).toISOString()
    if (new Date(expiresAt).getTime() <= now) {
      return {
        state,
        response: { success: false, error: '兑换码已过期' },
      }
    }
  }

  const serialNumber = await generateSerialNumber(machine_code, redeem_code, expiresAt, code.type)

  code.used_count += 1
  code.status = 'used'
  if (!code.first_redeemed_at) {
    code.first_redeemed_at = new Date().toISOString()
  }

  const records = nextState.recordsByCodeId[code.id] || []
  records.push({
    serial_number: serialNumber,
    machine_code,
    redeemed_at: new Date().toISOString(),
  })
  nextState.recordsByCodeId[code.id] = records

  return {
    state: nextState,
    response: {
      success: true,
      data: {
        serial_number: serialNumber,
        expires_at: expiresAt,
        type: code.type,
      },
    },
  }
}
