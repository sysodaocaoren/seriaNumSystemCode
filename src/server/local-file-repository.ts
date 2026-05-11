import fs from 'fs/promises'
import path from 'path'

import type {
  BatchGenerateParams,
  BatchGenerateResponse,
  DisableResponse,
  ExportResponse,
  RedeemCodeDetailResponse,
  RedeemCodeFilterParams,
  RedeemCodeLookupResponse,
  RedeemCodeListResponse,
  RedeemParams,
  RedeemResponse,
} from '../types'
import {
  batchGenerateInState,
  createEmptyRedeemStoreState,
  disableCodeInState,
  exportCodesInState,
  getCodeDetailFromState,
  lookupCodeFromState,
  listCodesFromState,
  redeemInState,
} from './repository-core'
import type { RedeemCodeRepository, RedeemStoreState } from './types'

async function ensureStateFile(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  try {
    await fs.access(filePath)
  } catch {
    await fs.writeFile(filePath, JSON.stringify(createEmptyRedeemStoreState(), null, 2), 'utf-8')
  }
}

async function readState(filePath: string): Promise<RedeemStoreState> {
  await ensureStateFile(filePath)
  const raw = await fs.readFile(filePath, 'utf-8')
  if (!raw.trim()) {
    return createEmptyRedeemStoreState()
  }
  return JSON.parse(raw) as RedeemStoreState
}

async function writeState(filePath: string, state: RedeemStoreState) {
  await ensureStateFile(filePath)
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8')
}

export function createLocalFileRepository(filePath: string): RedeemCodeRepository {
  return {
    async list(params: RedeemCodeFilterParams): Promise<RedeemCodeListResponse> {
      return listCodesFromState(await readState(filePath), params)
    },
    async getDetail(id: string): Promise<RedeemCodeDetailResponse> {
      return getCodeDetailFromState(await readState(filePath), id)
    },
    async lookupByCode(code: string): Promise<RedeemCodeLookupResponse> {
      return lookupCodeFromState(await readState(filePath), code)
    },
    async exportCodes(ids: string[]): Promise<ExportResponse> {
      const state = await readState(filePath)
      const result = exportCodesInState(state, ids)
      if (result.response.success) {
        await writeState(filePath, result.state)
      }
      return result.response
    },
    async disable(id: string): Promise<DisableResponse> {
      const state = await readState(filePath)
      const result = disableCodeInState(state, id)
      if (result.response.success) {
        await writeState(filePath, result.state)
      }
      return result.response
    },
    async batchGenerate(params: BatchGenerateParams): Promise<BatchGenerateResponse> {
      const state = await readState(filePath)
      const result = batchGenerateInState(state, params)
      if (result.response.success) {
        await writeState(filePath, result.state)
      }
      return result.response
    },
    async redeem(params: RedeemParams): Promise<RedeemResponse> {
      const state = await readState(filePath)
      const result = await redeemInState(state, params)
      if (result.response.success) {
        await writeState(filePath, result.state)
      }
      return result.response
    },
  }
}
