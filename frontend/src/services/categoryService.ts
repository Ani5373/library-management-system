// 分类目录管理服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import type { Category } from '@/types/models'

export interface CategoryTree extends Category {
  children: CategoryTree[]
}

export class CategoryService {
  // 创建分类
  static createCategory(data: {
    categoryName: string
    parentCategoryId?: string | null
    description: string
  }): Category {
    const categoryId = CryptoUtils.generateId('cat')

    const category: Category = {
      categoryId,
      categoryName: data.categoryName,
      parentCategoryId: data.parentCategoryId || null,
      description: data.description
    }

    Database.insert(TABLES.CATEGORIES, category)
    return category
  }

  // 获取所有分类
  static getAllCategories(): Category[] {
    return Database.getAll<Category>(TABLES.CATEGORIES)
  }

  // 根据 ID 获取分类
  static getCategoryById(categoryId: string): Category | null {
    return Database.getById<Category>(TABLES.CATEGORIES, 'categoryId', categoryId)
  }

  // 更新分类
  static updateCategory(
    categoryId: string,
    updates: Partial<Omit<Category, 'categoryId'>>
  ): Category | null {
    return Database.update<Category>(TABLES.CATEGORIES, 'categoryId', categoryId, updates)
  }

  // 删除分类
  static deleteCategory(categoryId: string): boolean {
    // 检查是否有子分类
    const children = this.getChildCategories(categoryId)
    if (children.length > 0) {
      return false // 有子分类时不能删除
    }

    return Database.delete<Category>(TABLES.CATEGORIES, 'categoryId', categoryId)
  }

  // 获取子分类
  static getChildCategories(parentId: string): Category[] {
    const categories = Database.getAll<Category>(TABLES.CATEGORIES)
    return categories.filter(cat => cat.parentCategoryId === parentId)
  }

  // 获取根分类
  static getRootCategories(): Category[] {
    const categories = Database.getAll<Category>(TABLES.CATEGORIES)
    return categories.filter(cat => cat.parentCategoryId === null)
  }

  // 构建分类树
  static buildCategoryTree(): CategoryTree[] {
    const categories = this.getAllCategories()
    const categoryMap = new Map<string, CategoryTree>()

    // 初始化所有分类
    categories.forEach(cat => {
      categoryMap.set(cat.categoryId, { ...cat, children: [] })
    })

    const roots: CategoryTree[] = []

    // 构建树形结构
    categories.forEach(cat => {
      const node = categoryMap.get(cat.categoryId)!
      if (cat.parentCategoryId === null) {
        roots.push(node)
      } else {
        const parent = categoryMap.get(cat.parentCategoryId)
        if (parent) {
          parent.children.push(node)
        }
      }
    })

    return roots
  }

  // 获取分类路径（从根到当前分类）
  static getCategoryPath(categoryId: string): Category[] {
    const path: Category[] = []
    let currentId: string | null = categoryId

    while (currentId) {
      const category = this.getCategoryById(currentId)
      if (!category) break

      path.unshift(category)
      currentId = category.parentCategoryId
    }

    return path
  }

  // 获取所有后代分类 ID
  static getDescendantIds(categoryId: string): string[] {
    const descendants: string[] = []
    const children = this.getChildCategories(categoryId)

    children.forEach(child => {
      descendants.push(child.categoryId)
      descendants.push(...this.getDescendantIds(child.categoryId))
    })

    return descendants
  }
}
