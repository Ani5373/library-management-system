// 出版物管理服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import type { Publication, Book, Magazine, EBook, Category } from '@/types/models'

export class PublicationService {
  // 创建出版物（根据类型设置借阅期限）
  static createPublication(data: {
    title: string
    author: string
    publisher: string
    publishDate: string
    type: 'book' | 'magazine' | 'ebook'
    location: string
    totalCopies: number
    categoryId: string
    // 书籍特有字段
    isbn?: string
    category?: string
    pages?: number
    language?: string
    edition?: string
    // 期刊特有字段
    issn?: string
    issueNumber?: string
    volume?: string
    // 电子书特有字段
    fileFormat?: string
    fileSize?: number
    downloadUrl?: string
    simultaneousUsers?: number
  }): Publication {
    const publicationId = CryptoUtils.generateId('pub')

    // 根据类型设置借阅期限
    let borrowPeriod = 30 // 默认30天
    if (data.type === 'magazine') {
      borrowPeriod = 7 // 期刊7天
    } else if (data.type === 'ebook') {
      borrowPeriod = 14 // 电子书14天
    }

    const publication: Publication = {
      publicationId,
      title: data.title,
      author: data.author,
      publisher: data.publisher,
      publishDate: data.publishDate,
      status: 'available',
      borrowPeriod,
      location: data.location,
      totalCopies: data.totalCopies,
      availableCopies: data.totalCopies,
      averageRating: 0,
      totalRatings: 0,
      categoryId: data.categoryId,
      type: data.type
    }

    Database.insert(TABLES.PUBLICATIONS, publication)

    // 根据类型创建具体的出版物记录
    if (data.type === 'book' && data.isbn) {
      const book: Book = {
        ...publication,
        isbn: data.isbn,
        category: data.category || '',
        pages: data.pages || 0,
        language: data.language || 'zh-CN',
        edition: data.edition || '第一版'
      }
      // 在实际应用中，这里应该有单独的 books 表
    } else if (data.type === 'magazine' && data.issn) {
      const magazine: Magazine = {
        ...publication,
        issn: data.issn,
        issueNumber: data.issueNumber || '',
        volume: data.volume || ''
      }
    } else if (data.type === 'ebook') {
      const ebook: EBook = {
        ...publication,
        fileFormat: data.fileFormat || 'PDF',
        fileSize: data.fileSize || 0,
        downloadUrl: data.downloadUrl || '',
        downloadCount: 0,
        simultaneousUsers: data.simultaneousUsers || 5
      }
    }

    return publication
  }

  // 获取所有出版物
  static getAllPublications(): Publication[] {
    return Database.getAll<Publication>(TABLES.PUBLICATIONS)
  }

  // 根据 ID 获取出版物
  static getPublicationById(publicationId: string): Publication | null {
    return Database.getById<Publication>(TABLES.PUBLICATIONS, 'publicationId', publicationId)
  }

  // 更新出版物信息
  static updatePublication(
    publicationId: string,
    updates: Partial<Omit<Publication, 'publicationId'>>
  ): Publication | null {
    return Database.update<Publication>(TABLES.PUBLICATIONS, 'publicationId', publicationId, updates)
  }

  // 下架出版物
  static removePublication(publicationId: string): boolean {
    const updated = Database.update<Publication>(
      TABLES.PUBLICATIONS,
      'publicationId',
      publicationId,
      { status: 'unavailable', availableCopies: 0 }
    )
    return updated !== null
  }

  // 删除出版物
  static deletePublication(publicationId: string): boolean {
    return Database.delete<Publication>(TABLES.PUBLICATIONS, 'publicationId', publicationId)
  }

  // 搜索出版物
  static searchPublications(query: {
    title?: string
    author?: string
    isbn?: string
    issn?: string
    categoryId?: string
    type?: 'book' | 'magazine' | 'ebook'
  }): Publication[] {
    const publications = Database.getAll<Publication>(TABLES.PUBLICATIONS)

    return publications.filter(pub => {
      if (query.title && !pub.title.toLowerCase().includes(query.title.toLowerCase())) {
        return false
      }
      if (query.author && !pub.author.toLowerCase().includes(query.author.toLowerCase())) {
        return false
      }
      if (query.categoryId && pub.categoryId !== query.categoryId) {
        return false
      }
      if (query.type && pub.type !== query.type) {
        return false
      }
      // ISBN/ISSN 搜索需要在具体类型中查找
      return true
    })
  }

  // 按分类搜索（包含子分类）
  static searchByCategory(categoryId: string): Publication[] {
    const category = Database.getById<Category>(TABLES.CATEGORIES, 'categoryId', categoryId)
    if (!category) return []

    // 获取所有子分类
    const childCategories = this.getChildCategories(categoryId)
    const categoryIds = [categoryId, ...childCategories.map(c => c.categoryId)]

    const publications = Database.getAll<Publication>(TABLES.PUBLICATIONS)
    return publications.filter(pub => categoryIds.includes(pub.categoryId))
  }

  // 获取子分类
  static getChildCategories(parentId: string): Category[] {
    const categories = Database.getAll<Category>(TABLES.CATEGORIES)
    return categories.filter(cat => cat.parentCategoryId === parentId)
  }

  // 更新可借数量
  static updateAvailableCopies(publicationId: string, delta: number): boolean {
    const publication = this.getPublicationById(publicationId)
    if (!publication) return false

    const newAvailable = publication.availableCopies + delta
    if (newAvailable < 0 || newAvailable > publication.totalCopies) {
      return false
    }

    const updated = Database.update<Publication>(
      TABLES.PUBLICATIONS,
      'publicationId',
      publicationId,
      {
        availableCopies: newAvailable,
        status: newAvailable > 0 ? 'available' : 'borrowed'
      }
    )

    return updated !== null
  }

  // 更新评分
  static updateRating(publicationId: string, newRating: number): boolean {
    const publication = this.getPublicationById(publicationId)
    if (!publication) return false

    const totalRatings = publication.totalRatings + 1
    const averageRating =
      (publication.averageRating * publication.totalRatings + newRating) / totalRatings

    const updated = Database.update<Publication>(
      TABLES.PUBLICATIONS,
      'publicationId',
      publicationId,
      {
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings
      }
    )

    return updated !== null
  }

  // 重新计算评分
  static recalculateRating(publicationId: string, ratings: number[]): boolean {
    if (ratings.length === 0) {
      return Database.update<Publication>(
        TABLES.PUBLICATIONS,
        'publicationId',
        publicationId,
        { averageRating: 0, totalRatings: 0 }
      ) !== null
    }

    const sum = ratings.reduce((a, b) => a + b, 0)
    const average = sum / ratings.length

    return Database.update<Publication>(
      TABLES.PUBLICATIONS,
      'publicationId',
      publicationId,
      {
        averageRating: Math.round(average * 100) / 100,
        totalRatings: ratings.length
      }
    ) !== null
  }
}
