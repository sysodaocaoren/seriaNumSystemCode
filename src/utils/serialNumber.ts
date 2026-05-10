import type { RedeemCodeType } from '../types'

const SECRET_KEY = 'SerialNumSystem2026'
const SERIAL_PREFIX = 'SN1.'
const MACHINE_CODE_PATTERN = /^[A-Z0-9]{32}$/

type SerialPayload = {
  v: 1
  m: string
  r: string
  e: string | null
  t?: RedeemCodeType
  i: string
}

function normalizeMachineCode(value: string): string {
  return String(value || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 32)
}

function normalizeRedeemCode(value: string): string {
  const clean = String(value || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 16)
  const groups = clean.match(/.{1,4}/g) || []
  return groups.join('-')
}

function coerceIsoDate(value?: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function buildKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(SECRET_KEY))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function compactSerial(serialNumber: string): string {
  return String(serialNumber || '').trim().replace(/\s+/g, '')
}

export function formatSerialNumber(serialNumber: string): string {
  return compactSerial(serialNumber)
}

export function validateMachineCodeFormat(machineCode: string): boolean {
  return MACHINE_CODE_PATTERN.test(normalizeMachineCode(machineCode))
}

export const generateSerialNumber = async (
  machineCode: string,
  redeemCode: string,
  expiresAt: string | undefined,
  type: RedeemCodeType,
): Promise<string> => {
  const normalizedMachineCode = normalizeMachineCode(machineCode)
  const normalizedRedeemCode = normalizeRedeemCode(redeemCode)

  if (!validateMachineCodeFormat(normalizedMachineCode)) {
    throw new Error('机器码格式不正确，必须是 32 位字母数字')
  }

  if (!validateRedeemCodeFormat(normalizedRedeemCode)) {
    throw new Error('兑换码格式不正确，应为 XXXX-XXXX-XXXX-XXXX')
  }

  const payload: SerialPayload = {
    v: 1,
    m: normalizedMachineCode,
    r: normalizedRedeemCode,
    e: coerceIsoDate(expiresAt),
    t: type,
    i: new Date().toISOString(),
  }

  const encoder = new TextEncoder()
  const key = await buildKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(payload)),
    ),
  )

  const merged = new Uint8Array(iv.length + encrypted.length)
  merged.set(iv, 0)
  merged.set(encrypted, iv.length)

  return `${SERIAL_PREFIX}${toBase64Url(merged)}`
}

export const parseSerialNumber = async (serialNumber: string): Promise<{
  machineCode: string
  redeemCode: string
  expiresAt: string | null
  type?: RedeemCodeType
  issuedAt: string
}> => {
  const compact = compactSerial(serialNumber)
  if (!compact.toUpperCase().startsWith(SERIAL_PREFIX)) {
    throw new Error('序列号格式不正确')
  }

  const bytes = fromBase64Url(compact.slice(SERIAL_PREFIX.length))
  if (bytes.length < 29) {
    throw new Error('序列号内容不完整')
  }

  const iv = bytes.slice(0, 12)
  const encrypted = bytes.slice(12)
  const key = await buildKey()
  const decoder = new TextDecoder()
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  const parsed = JSON.parse(decoder.decode(decrypted)) as Partial<SerialPayload>

  const machineCode = normalizeMachineCode(parsed.m || '')
  const redeemCode = normalizeRedeemCode(parsed.r || '')
  const expiresAt = coerceIsoDate(parsed.e)
  const issuedAt = coerceIsoDate(parsed.i)

  if (
    parsed.v !== 1 ||
    !validateMachineCodeFormat(machineCode) ||
    !validateRedeemCodeFormat(redeemCode) ||
    !issuedAt
  ) {
    throw new Error('序列号内容无效')
  }

  return {
    machineCode,
    redeemCode,
    expiresAt,
    type: parsed.t,
    issuedAt,
  }
}

export const validateSerialNumberFormat = (serialNumber: string): boolean => {
  const compact = compactSerial(serialNumber)
  return /^SN1\.[A-Za-z0-9\-_]{48,}$/.test(compact)
}

export const formatRedeemCodeInput = (input: string): string => {
  const clean = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const limited = clean.substring(0, 16)
  const groups = limited.match(/.{1,4}/g) || []
  return groups.join('-')
}

export const validateRedeemCodeFormat = (redeemCode: string): boolean => {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return pattern.test(normalizeRedeemCode(redeemCode))
}
