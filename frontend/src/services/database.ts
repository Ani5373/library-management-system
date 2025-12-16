// 本地数据库服务 - 管理所有数据表
import { StorageService } from './storage'
import type {
  User,
  Reader,
  Admin,
  Publication,
  BorrowRecord,
  Reservation,
  Fine,
  Notification,
  Review,
  Category
} from '@/types/models'

// 数据表名称
export const TABLES = {
  USERS: 'users',
  READERS: 'readers',
  ADMINS: 'admins',
  PUBLICATIONS: 'publications',
  BORROW_RECORDS: 'borrowRecords',
  RESERVATIONS: 'reservations',
  FINES: 'fines',
  NOTIFICATIONS: 'notifications',
  REVIEWS: 'reviews',
  CATEGORIES: 'categories'
} as const

export class Database {
  // 初始化数据库
  static init(): void {
    Object.values(TABLES).forEach(table => {
      if (!StorageService.get(table)) {
        StorageService.set(table, [])
      }
    })
    this.initDefaultData()
  }

  // 初始化默认数据
  static initDefaultData(): void {
    const users = this.getAll<User>(TABLES.USERS)
    if (users.length === 0) {
      // 创建默认管理员账户
      const adminUser: User = {
        userId: 'admin-001',
        username: 'admin',
        password: 'admin123', // 实际应用中应该加密
        name: '系统管理员',
        email: 'admin@library.com',
        phone: '13800138000',
        registrationDate: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        role: 'superadmin'
      }
      this.insert(TABLES.USERS, adminUser)

      const admin: Admin = {
        adminId: 'admin-001',
        userId: 'admin-001',
        adminRole: 'superadmin',
        department: '系统管理部'
      }
      this.insert(TABLES.ADMINS, admin)
    }

    // 初始化默认分类
    const categories = this.getAll<Category>(TABLES.CATEGORIES)
    if (categories.length === 0) {
      const defaultCategories: Category[] = [
        {
          categoryId: 'cat-001',
          categoryName: '文学',
          parentCategoryId: null,
          description: '文学类图书'
        },
        {
          categoryId: 'cat-002',
          categoryName: '科技',
          parentCategoryId: null,
          description: '科技类图书'
        },
        {
          categoryId: 'cat-003',
          categoryName: '历史',
          parentCategoryId: null,
          description: '历史类图书'
        }
      ]
      defaultCategories.forEach(cat => this.insert(TABLES.CATEGORIES, cat))
    }

    // 初始化示例图书
    const publications = this.getAll<Publication>(TABLES.PUBLICATIONS)
    if (publications.length === 0) {
      const sampleBooks: Publication[] = [
        {
          publicationId: 'pub-001',
          title: '三体',
          author: '刘慈欣',
          publisher: '重庆出版社',
          publishDate: '2008-01-01',
          status: 'available',
          borrowPeriod: 30,
          location: 'A区-1层-001',
          totalCopies: 5,
          availableCopies: 5,
          averageRating: 4.8,
          totalRatings: 120,
          categoryId: 'cat-002',
          type: 'book'
        },
        {
          publicationId: 'pub-002',
          title: '活着',
          author: '余华',
          publisher: '作家出版社',
          publishDate: '1993-01-01',
          status: 'available',
          borrowPeriod: 30,
          location: 'A区-1层-002',
          totalCopies: 3,
          availableCopies: 2,
          averageRating: 4.9,
          totalRatings: 200,
          categoryId: 'cat-001',
          type: 'book'
        },
        {
          publicationId: 'pub-003',
          title: '人类简史',
          author: '尤瓦尔·赫拉利',
          publisher: '中信出版社',
          publishDate: '2014-11-01',
          status: 'available',
          borrowPeriod: 30,
          location: 'A区-2层-001',
          totalCopies: 4,
          availableCopies: 4,
          averageRating: 4.7,
          totalRatings: 150,
          categoryId: 'cat-003',
          type: 'book'
        },
        {
          publicationId: 'pub-004',
          title: '百年孤独',
          author: '加西亚·马尔克斯',
          publisher: '南海出版公司',
          publishDate: '2011-06-01',
          status: 'available',
          borrowPeriod: 30,
          location: 'A区-1层-003',
          totalCopies: 3,
          availableCopies: 1,
          averageRating: 4.6,
          totalRatings: 180,
          categoryId: 'cat-001',
          type: 'book'
        },
        {
          publicationId: 'pub-005',
          title: '深入理解计算机系统',
          author: 'Randal E. Bryant',
          publisher: '机械工业出版社',
          publishDate: '2016-03-01',
          status: 'available',
          borrowPeriod: 30,
          location: 'B区-1层-001',
          totalCopies: 2,
          availableCopies: 2,
          averageRating: 4.9,
          totalRatings: 90,
          categoryId: 'cat-002',
          type: 'book'
        },
        {
          publicationId: 'pub-006',
          title: '读者',
          author: '读者杂志社',
          publisher: '读者出版传媒股份有限公司',
          publishDate: '2024-01-01',
          status: 'available',
          borrowPeriod: 7,
          location: 'C区-1层-001',
          totalCopies: 10,
          availableCopies: 8,
          averageRating: 4.5,
          totalRatings: 50,
          categoryId: 'cat-001',
          type: 'magazine'
        }
      ]
      sampleBooks.forEach(book => this.insert(TABLES.PUBLICATIONS, book))
    }
  }

  // 获取所有记录
  static getAll<T>(table: string): T[] {
    return StorageService.get<T[]>(table) || []
  }

  // 根据 ID 获取记录
  static getById<T extends { [key: string]: any }>(
    table: string,
    idField: string,
    id: string
  ): T | null {
    const records = this.getAll<T>(table)
    return records.find(record => record[idField] === id) || null
  }

  // 插入记录
  static insert<T>(table: string, record: T): T {
    const records = this.getAll<T>(table)
    records.push(record)
    StorageService.set(table, records)
    return record
  }

  // 更新记录
  static update<T extends { [key: string]: any }>(
    table: string,
    idField: string,
    id: string,
    updates: Partial<T>
  ): T | null {
    const records = this.getAll<T>(table)
    const index = records.findIndex(record => record[idField] === id)
    if (index === -1) return null

    records[index] = { ...records[index], ...updates }
    StorageService.set(table, records)
    return records[index]
  }

  // 删除记录
  static delete<T extends { [key: string]: any }>(
    table: string,
    idField: string,
    id: string
  ): boolean {
    const records = this.getAll<T>(table)
    const filtered = records.filter(record => record[idField] !== id)
    if (filtered.length === records.length) return false

    StorageService.set(table, filtered)
    return true
  }

  // 查询记录
  static query<T>(table: string, predicate: (record: T) => boolean): T[] {
    const records = this.getAll<T>(table)
    return records.filter(predicate)
  }

  // 清空表
  static clearTable(table: string): void {
    StorageService.set(table, [])
  }

  // 清空所有数据
  static clearAll(): void {
    StorageService.clear()
    this.init()
  }

  // 导出数据
  static exportData(): string {
    const data: Record<string, any> = {}
    Object.values(TABLES).forEach(table => {
      data[table] = this.getAll(table)
    })
    return JSON.stringify(data, null, 2)
  }

  // 导入数据
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      Object.entries(data).forEach(([table, records]) => {
        StorageService.set(table, records)
      })
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}

// 初始化数据库
Database.init()
