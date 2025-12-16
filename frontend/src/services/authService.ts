// 认证服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import type { User, Reader, Admin } from '@/types/models'

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token'
  private static readonly CURRENT_USER_KEY = 'current_user'

  // 用户登录
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { username, password } = credentials

    // 查找用户
    const users = Database.getAll<User>(TABLES.USERS)
    const user = users.find(u => u.username === username)

    if (!user) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 验证密码（简化版，实际应该比对哈希值）
    const isValid = await CryptoUtils.verifyPassword(password, user.password)
    if (!isValid && password !== user.password) {
      // 兼容未加密的密码
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 更新最后登录时间
    const updatedUser = Database.update<User>(
      TABLES.USERS,
      'userId',
      user.userId,
      { lastLoginTime: new Date().toISOString() }
    )

    // 生成 Token
    const token = CryptoUtils.generateToken({
      userId: user.userId,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7天过期
    })

    // 保存 Token 和用户信息
    localStorage.setItem(this.TOKEN_KEY, token)
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser || user))

    return {
      success: true,
      message: '登录成功',
      token,
      user: updatedUser || user
    }
  }

  // 用户登出
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }

  // 获取当前用户
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.CURRENT_USER_KEY)
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  // 获取当前 Token
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false
    return !CryptoUtils.isTokenExpired(token)
  }

  // 检查用户角色
  static hasRole(role: 'reader' | 'admin' | 'superadmin'): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    if (role === 'reader') {
      return ['reader', 'admin', 'superadmin'].includes(user.role)
    }
    if (role === 'admin') {
      return ['admin', 'superadmin'].includes(user.role)
    }
    if (role === 'superadmin') {
      return user.role === 'superadmin'
    }
    return false
  }

  // 修改密码
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = Database.getById<User>(TABLES.USERS, 'userId', userId)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    // 验证旧密码
    const isValid = await CryptoUtils.verifyPassword(oldPassword, user.password)
    if (!isValid && oldPassword !== user.password) {
      return { success: false, message: '原密码错误' }
    }

    // 更新密码（简化版，实际应该加密）
    const hashedPassword = await CryptoUtils.hashPassword(newPassword)
    Database.update<User>(TABLES.USERS, 'userId', userId, {
      password: hashedPassword
    })

    return { success: true, message: '密码修改成功' }
  }

  // 注册读者
  static async registerReader(data: {
    username: string
    password: string
    name: string
    email: string
    phone: string
  }): Promise<{ success: boolean; message: string; user?: User }> {
    // 检查用户名是否已存在
    const users = Database.getAll<User>(TABLES.USERS)
    if (users.some(u => u.username === data.username)) {
      return { success: false, message: '用户名已存在' }
    }

    // 检查邮箱是否已存在
    if (users.some(u => u.email === data.email)) {
      return { success: false, message: '邮箱已被使用' }
    }

    // 创建用户
    const userId = CryptoUtils.generateId('user')
    const hashedPassword = await CryptoUtils.hashPassword(data.password)
    
    const user: User = {
      userId,
      username: data.username,
      password: hashedPassword,
      name: data.name,
      email: data.email,
      phone: data.phone,
      registrationDate: new Date().toISOString(),
      lastLoginTime: new Date().toISOString(),
      role: 'reader'
    }

    Database.insert(TABLES.USERS, user)

    // 创建读者信息
    const reader: Reader = {
      readerId: CryptoUtils.generateId('reader'),
      userId,
      borrowLimit: 7,
      borrowedCount: 0,
      membershipLevel: 'basic',
      creditScore: 100,
      totalFines: 0
    }

    Database.insert(TABLES.READERS, reader)

    return { success: true, message: '注册成功', user }
  }
}
