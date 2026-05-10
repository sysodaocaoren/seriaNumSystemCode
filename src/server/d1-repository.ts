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
import type { RedeemCodeRepository } from './types'

type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{ results: T[] }>
      first: <T = unknown>(columnName?: string) => Promise<T | null>
      run: () => Promise<unknown>
    }
    all: <T = unknown>() => Promise<{ results: T[] }>
    first: <T = unknown>(columnName?: string) => Promise<T | null>
    run: () => Promise<unknown>
  }
  exec: (query: string) => Promise<unknown>
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS redeem_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  exported INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  first_redeemed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON redeem_codes(code);
CREATE TABLE IF NOT EXISTS redeem_records (
  id TEXT PRIMARY KEY,
  redeem_code_id TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  machine_code TEXT NOT NULL,
  redeemed_at TEXT NOT NULL,
  FOREIGN KEY(redeem_code_id) REFERENCES redeem_codes(id)
);
CREATE INDEX IF NOT EXISTS idx_redeem_records_code_id ON redeem_records(redeem_code_id);
`

function toRedeemCode(row: any): RedeemCode {
  return {
    id: String(row.id),
    code: String(row.code),
    type: row.type as RedeemCodeType,
    status: row.status,
    exported: Number(row.exported) === 1,
    used_count: Number(row.used_count || 0),
    first_redeemed_at: row.first_redeemed_at || undefined,
    created_at: String(row.created_at),
  }
}

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let index = 0; index < 16; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code.match(/.{4}/g)?.join('-') || code
}

export async function ensureD1Schema(db: D1DatabaseLike) {
  await db.exec(SCHEMA_SQL)
}

export function createD1Repository(db: D1DatabaseLike): RedeemCodeRepository {
  return {
    async list(params: RedeemCodeFilterParams): Promise<RedeemCodeListResponse> {
      await ensureD1Schema(db)

      const whereClauses: string[] = []
      const values: unknown[] = []

      if (params.status && params.status !== 'all') {
        whereClauses.push('status = ?')
        values.push(params.status)
      }
      if (params.type && params.type !== 'all') {
        whereClauses.push('type = ?')
        values.push(params.type)
      }
      if (params.exported !== undefined && params.exported !== 'all') {
        whereClauses.push('exported = ?')
        values.push(params.exported ? 1 : 0)
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
      const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC'
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const offset = (page - 1) * pageSize

      const countRow = await db
        .prepare(`SELECT COUNT(*) as total FROM redeem_codes ${whereSql}`)
        .bind(...values)
        .first<{ total: number }>()

      const listResult = await db
        .prepare(`
          SELECT id, code, type, status, exported, used_count, first_redeemed_at, created_at
          FROM redeem_codes
          ${whereSql}
          ORDER BY datetime(created_at) ${sortOrder}
          LIMIT ? OFFSET ?
        `)
        .bind(...values, pageSize, offset)
        .all<any>()

      return {
        success: true,
        data: {
          list: listResult.results.map(toRedeemCode),
          total: Number(countRow?.total || 0),
          page,
          pageSize,
        },
      }
    },

    async getDetail(id: string): Promise<RedeemCodeDetailResponse> {
      await ensureD1Schema(db)
      const codeRow = await db
        .prepare(`
          SELECT id, code, type, status, exported, used_count, first_redeemed_at, created_at
          FROM redeem_codes
          WHERE id = ?
        `)
        .bind(id)
        .first<any>()

      if (!codeRow) {
        return { success: false, error: '兑换码不存在' }
      }

      const records = await db
        .prepare(`
          SELECT serial_number, machine_code, redeemed_at
          FROM redeem_records
          WHERE redeem_code_id = ?
          ORDER BY datetime(redeemed_at) DESC
        `)
        .bind(id)
        .all<any>()

      return {
        success: true,
        data: {
          ...toRedeemCode(codeRow),
          records: records.results.map((item) => ({
            serial_number: String(item.serial_number),
            machine_code: String(item.machine_code),
            redeemed_at: String(item.redeemed_at),
          })),
        },
      }
    },

    async exportCodes(ids: string[]): Promise<ExportResponse> {
      await ensureD1Schema(db)
      if (ids.length === 0) {
        return { success: false, error: '未找到选中的兑换码' }
      }

      const placeholders = ids.map(() => '?').join(', ')
      const selected = await db
        .prepare(`
          SELECT id, code, exported
          FROM redeem_codes
          WHERE id IN (${placeholders})
        `)
        .bind(...ids)
        .all<any>()

      if (selected.results.length === 0) {
        return { success: false, error: '未找到选中的兑换码' }
      }

      const alreadyExportedCount = selected.results.filter((item) => Number(item.exported) === 1).length
      await db
        .prepare(`UPDATE redeem_codes SET exported = 1 WHERE id IN (${placeholders})`)
        .bind(...ids)
        .run()

      return {
        success: true,
        data: {
          codes: selected.results.map((item) => String(item.code)),
          exportedCount: selected.results.length,
          alreadyExportedCount,
        },
      }
    },

    async disable(id: string): Promise<DisableResponse> {
      await ensureD1Schema(db)
      const current = await db
        .prepare(`SELECT status FROM redeem_codes WHERE id = ?`)
        .bind(id)
        .first<{ status: string }>()

      if (!current) {
        return { success: false, error: '兑换码不存在' }
      }
      if (current.status === 'disabled') {
        return { success: false, error: '兑换码已被禁用' }
      }

      await db.prepare(`UPDATE redeem_codes SET status = 'disabled' WHERE id = ?`).bind(id).run()
      return { success: true }
    },

    async batchGenerate(params: BatchGenerateParams): Promise<BatchGenerateResponse> {
      await ensureD1Schema(db)
      const { count, type } = params
      if (count < 1 || count > 1000) {
        return { success: false, error: '生成数量必须在 1-1000 之间' }
      }

      const createdAt = new Date().toISOString()
      const generatedCodes: RedeemCode[] = []
      for (let index = 0; index < count; index += 1) {
        let code = generateUniqueCode()
        while (
          await db.prepare(`SELECT id FROM redeem_codes WHERE code = ?`).bind(code).first()
        ) {
          code = generateUniqueCode()
        }

        const item: RedeemCode = {
          id: crypto.randomUUID(),
          code,
          type: type as RedeemCodeType,
          status: 'unused',
          exported: false,
          used_count: 0,
          created_at: createdAt,
        }

        await db
          .prepare(`
            INSERT INTO redeem_codes (id, code, type, status, exported, used_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(item.id, item.code, item.type, item.status, 0, 0, item.created_at)
          .run()

        generatedCodes.push(item)
      }

      return {
        success: true,
        data: {
          codes: generatedCodes,
          generatedCount: generatedCodes.length,
        },
      }
    },

    async redeem(params: RedeemParams): Promise<RedeemResponse> {
      await ensureD1Schema(db)
      const { redeem_code, machine_code } = params
      const codeRow = await db
        .prepare(`
          SELECT id, code, type, status, exported, used_count, first_redeemed_at, created_at
          FROM redeem_codes
          WHERE code = ?
        `)
        .bind(redeem_code)
        .first<any>()

      if (!codeRow) {
        return { success: false, error: '兑换码无效' }
      }

      const code = toRedeemCode(codeRow)
      if (code.status === 'disabled') {
        return { success: false, error: '兑换码无效' }
      }
      if (code.used_count >= 3) {
        return { success: false, error: '兑换次数已用完' }
      }

      const now = Date.now()
      let expiresAt: string | undefined
      if (code.type !== 'lifetime') {
        const firstRedeem = code.first_redeemed_at ? new Date(code.first_redeemed_at).getTime() : now
        const duration = code.type === '6m' ? 180 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000
        expiresAt = new Date(firstRedeem + duration).toISOString()
        if (new Date(expiresAt).getTime() <= now) {
          return { success: false, error: '兑换码已过期' }
        }
      }

      const serialNumber = await generateSerialNumber(machine_code, redeem_code, expiresAt, code.type)
      const redeemedAt = new Date().toISOString()
      const nextFirstRedeemedAt = code.first_redeemed_at || redeemedAt

      await db
        .prepare(`
          UPDATE redeem_codes
          SET used_count = ?, status = 'used', first_redeemed_at = ?
          WHERE id = ?
        `)
        .bind(code.used_count + 1, nextFirstRedeemedAt, code.id)
        .run()

      await db
        .prepare(`
          INSERT INTO redeem_records (id, redeem_code_id, serial_number, machine_code, redeemed_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(crypto.randomUUID(), code.id, serialNumber, machine_code, redeemedAt)
        .run()

      return {
        success: true,
        data: {
          serial_number: serialNumber,
          expires_at: expiresAt,
          type: code.type,
        },
      }
    },
  }
}
