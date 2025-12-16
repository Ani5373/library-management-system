// 用户管理服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import type { User, Reader, Admin } from '@/types/models'

export class UserService {
  // 注册读者
  static async registerReader(data: {
    username: string
    password: string
    name: string
    email: string
    phone: string
  }): Promise<{ success: boolean; message: string; reader?: Reader }> {
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

    // 创建读者信息（初始借阅上限 7，信用分数 100）
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

    return { success: true, message: '注册成功', reader }
  }

  // 获取读者信息
  static getReaderByUserId(userId: string): Reader | null {
    const readers = Database.getAll<Reader>(TABLES.READERS)
    return readers.find(r => r.userId === userId) || null
  }

  // 获取读者详情（包含用户信息）
  static getReaderDetails(readerId: string): (Reader & { user: User }) | null {
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', readerId)
    if (!reader) return null

    const user = Database.getById<User>(TABLES.USERS, 'userId', reader.userId)
    if (!user) return null

    return { ...reader, user }
  }

  // 更新读者信息
  static updateReader(
    readerId: string,
    updates: Partial<Omit<Reader, 'readerId' | 'userId'>>
  ): Reader | null {
    return Database.update<Reader>(TABLES.READERS, 'readerId', readerId, updates)
  }

  // 更新用户信息
  static updateUser(
    userId: string,
    updates: Partial<Omit<User, 'userId' | 'password' | 'role'>>
  ): User | null {
    return Database.update<User>(TABLES.USERS, 'userId', userId, updates)
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

    // 更新密码
    const hashedPassword = await CryptoUtils.hashPassword(newPassword)
    Database.update<User>(TABLES.USERS, 'userId', userId, {
      password: hashedPassword
    })

    return { success: true, message: '密码修改成功' }
  }

  // 注册管理员
  static async registerAdmin(data: {
    username: string
    password: string
    name: string
    email: string
    phone: string
    adminRole: string
    department: string
  }): Promise<{ success: boolean; message: string; admin?: Admin }> {
    // 检查用户名是否已存在
    const users = Database.getAll<User>(TABLES.USERS)
    if (users.some(u => u.username === data.username)) {
      return { success: false, message: '用户名已存在' }
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
      role: 'admin'
    }

    Database.insert(TABLES.USERS, user)

    // 创建管理员信息
    const admin: Admin = {
      adminId: CryptoUtils.generateId('admin'),
      userId,
      adminRole: data.adminRole,
      department: data.department
    }

    Database.insert(TABLES.ADMINS, admin)

    return { success: true, message: '管理员注册成功', admin }
  }

  // 删除管理员（禁用账户）
  static deleteAdmin(adminId: string): { success: boolean; message: string } {
    const admin = Database.getById<Admin>(TABLES.ADMINS, 'adminId', adminId)
    if (!admin) {
      return { success: false, message: '管理员不存在' }
    }

    // 删除管理员记录
    Database.delete<Admin>(TABLES.ADMINS, 'adminId', adminId)

    // 更新用户角色为普通读者或删除用户
    Database.delete<User>(TABLES.USERS, 'userId', admin.userId)

    return { success: true, message: '管理员已删除' }
  }

  // 获取所有读者
  static getAllReaders(): Reader[] {
    return Database.getAll<Reader>(TABLES.READERS)
  }

  // 获取所有管理员
  static getAllAdmins(): Admin[] {
    return Database.getAll<Admin>(TABLES.ADMINS)
  }
}
