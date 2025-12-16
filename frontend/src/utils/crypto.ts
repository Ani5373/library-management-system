// 简单的密码加密工具（浏览器环境）
// 注意：这是简化版本，实际生产环境应使用更安全的方案

export class CryptoUtils {
  // 简单的哈希函数（用于演示，实际应使用 Web Crypto API）
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 验证密码
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }

  // 生成随机 ID
  static generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 9)
    return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`
  }

  // 生成 JWT Token（简化版）
  static generateToken(payload: any): string {
    const header = { alg: 'HS256', typ: 'JWT' }
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = btoa(`${encodedHeader}.${encodedPayload}`)
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  // 解析 JWT Token
  static parseToken(token: string): any {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      return JSON.parse(atob(parts[1]))
    } catch {
      return null
    }
  }

  // 验证 Token 是否过期
  static isTokenExpired(token: string): boolean {
    const payload = this.parseToken(token)
    if (!payload || !payload.exp) return true
    return Date.now() >= payload.exp * 1000
  }
}
