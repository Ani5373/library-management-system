import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { AuthService } from '../authService'
import { Database, TABLES } from '../database'
import { CryptoUtils } from '@/utils/crypto'
import type { User } from '@/types/models'

describe('AuthService Property Tests', () => {
  beforeEach(() => {
    // 清空数据库
    Database.clearAll()
  })

  // Feature: library-management-system, Property 1: 有效凭据登录成功
  it('Property 1: 有效凭据登录成功 - 对于任何有效的用户凭据，登录操作应该返回成功状态和有效的 JWT 令牌', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }),
          password: fc.string({ minLength: 6, maxLength: 20 }),
          name: fc.string({ minLength: 2, maxLength: 50 }),
          email: fc.emailAddress(),
          phone: fc.string({ minLength: 11, maxLength: 11 })
        }),
        async (userData) => {
          // 创建用户
          const userId = CryptoUtils.generateId('user')
          const hashedPassword = await CryptoUtils.hashPassword(userData.password)
          
          const user: User = {
            userId,
            username: userData.username,
            password: hashedPassword,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            registrationDate: new Date().toISOString(),
            lastLoginTime: new Date().toISOString(),
            role: 'reader'
          }

          Database.insert(TABLES.USERS, user)

          // 尝试登录
          const result = await AuthService.login({
            username: userData.username,
            password: userData.password
          })

          // 验证结果
          expect(result.success).toBe(true)
          expect(result.token).toBeDefined()
          expect(result.token).not.toBe('')
          expect(result.user).toBeDefined()
          expect(result.user?.username).toBe(userData.username)

          // 验证 token 可以解析
          const payload = CryptoUtils.parseToken(result.token!)
          expect(payload).toBeDefined()
          expect(payload.userId).toBe(userId)
          expect(payload.username).toBe(userData.username)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: library-management-system, Property 2: 无效凭据登录失败
  it('Property 2: 无效凭据登录失败 - 对于任何无效的用户凭据，登录操作应该返回失败状态且不生成令牌', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }),
          password: fc.string({ minLength: 6, maxLength: 20 }),
          wrongPassword: fc.string({ minLength: 6, maxLength: 20 })
        }).filter(data => data.password !== data.wrongPassword),
        async (userData) => {
          // 创建用户
          const userId = CryptoUtils.generateId('user')
          const hashedPassword = await CryptoUtils.hashPassword(userData.password)
          
          const user: User = {
            userId,
            username: userData.username,
            password: hashedPassword,
            name: 'Test User',
            email: 'test@example.com',
            phone: '13800138000',
            registrationDate: new Date().toISOString(),
            lastLoginTime: new Date().toISOString(),
            role: 'reader'
          }

          Database.insert(TABLES.USERS, user)

          // 尝试用错误密码登录
          const result = await AuthService.login({
            username: userData.username,
            password: userData.wrongPassword
          })

          // 验证结果
          expect(result.success).toBe(false)
          expect(result.token).toBeUndefined()
          expect(result.message).toContain('错误')
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: library-management-system, Property 3: 登录更新最后登录时间
  it('Property 3: 登录更新最后登录时间 - 对于任何成功的登录操作，用户的最后登录时间应该被更新为当前时间', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }),
          password: fc.string({ minLength: 6, maxLength: 20 })
        }),
        async (userData) => {
          // 创建用户
          const userId = CryptoUtils.generateId('user')
          const hashedPassword = await CryptoUtils.hashPassword(userData.password)
          const oldLoginTime = new Date('2020-01-01').toISOString()
          
          const user: User = {
            userId,
            username: userData.username,
            password: hashedPassword,
            name: 'Test User',
            email: 'test@example.com',
            phone: '13800138000',
            registrationDate: new Date().toISOString(),
            lastLoginTime: oldLoginTime,
            role: 'reader'
          }

          Database.insert(TABLES.USERS, user)

          const beforeLogin = new Date().getTime()

          // 登录
          await AuthService.login({
            username: userData.username,
            password: userData.password
          })

          const afterLogin = new Date().getTime()

          // 获取更新后的用户
          const updatedUser = Database.getById<User>(TABLES.USERS, 'userId', userId)
          expect(updatedUser).toBeDefined()

          const lastLoginTime = new Date(updatedUser!.lastLoginTime).getTime()

          // 验证最后登录时间在登录前后之间
          expect(lastLoginTime).toBeGreaterThanOrEqual(beforeLogin - 1000) // 允许1秒误差
          expect(lastLoginTime).toBeLessThanOrEqual(afterLogin + 1000)
          expect(updatedUser!.lastLoginTime).not.toBe(oldLoginTime)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: library-management-system, Property 4: 登出清除会话
  it('Property 4: 登出清除会话 - 对于任何有效的登出请求，用户的会话令牌应该被标记为无效', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }),
          password: fc.string({ minLength: 6, maxLength: 20 })
        }),
        async (userData) => {
          // 创建用户
          const userId = CryptoUtils.generateId('user')
          const hashedPassword = await CryptoUtils.hashPassword(userData.password)
          
          const user: User = {
            userId,
            username: userData.username,
            password: hashedPassword,
            name: 'Test User',
            email: 'test@example.com',
            phone: '13800138000',
            registrationDate: new Date().toISOString(),
            lastLoginTime: new Date().toISOString(),
            role: 'reader'
          }

          Database.insert(TABLES.USERS, user)

          // 登录
          const loginResult = await AuthService.login({
            username: userData.username,
            password: userData.password
          })

          expect(loginResult.success).toBe(true)
          expect(AuthService.getToken()).toBeDefined()
          expect(AuthService.getCurrentUser()).toBeDefined()

          // 登出
          AuthService.logout()

          // 验证会话已清除
          expect(AuthService.getToken()).toBeNull()
          expect(AuthService.getCurrentUser()).toBeNull()
          expect(AuthService.isAuthenticated()).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
