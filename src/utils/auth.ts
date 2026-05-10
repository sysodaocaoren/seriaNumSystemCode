const AUTH_TOKEN_KEY = 'admin_auth_token'

export interface AuthResponse {
  success: boolean
  token?: string
  error?: string
}

// 检查 localStorage 是否可用
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

// 内存存储（localStorage 不可用时使用）
let memoryStorage: string | null = null

export const auth = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    // 模拟API调用，预置账号 admin / admin123
    if (username === 'admin' && password === 'admin123') {
      const token = 'mock_jwt_token_' + Date.now()
      try {
        if (isLocalStorageAvailable()) {
          localStorage.setItem(AUTH_TOKEN_KEY, token)
        } else {
          memoryStorage = token
        }
        return { success: true, token }
      } catch (e) {
        // 如果存储失败，使用内存存储
        memoryStorage = token
        return { success: true, token }
      }
    }
    return { success: false, error: '账号或密码错误' }
  },

  logout: () => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    } catch (e) {
      // 忽略错误
    }
    memoryStorage = null
  },

  isAuthenticated: (): boolean => {
    try {
      if (isLocalStorageAvailable()) {
        return !!localStorage.getItem(AUTH_TOKEN_KEY)
      }
      return !!memoryStorage
    } catch (e) {
      return !!memoryStorage
    }
  },

  getToken: (): string | null => {
    try {
      if (isLocalStorageAvailable()) {
        return localStorage.getItem(AUTH_TOKEN_KEY)
      }
      return memoryStorage
    } catch (e) {
      return memoryStorage
    }
  },
}
