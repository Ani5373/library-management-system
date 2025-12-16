// 本地存储服务 - 使用 LocalStorage 作为数据持久化方案

const STORAGE_PREFIX = 'library_'

export class StorageService {
  // 获取数据
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  }

  // 保存数据
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to storage:', error)
    }
  }

  // 删除数据
  static remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key)
  }

  // 清空所有数据
  static clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }

  // 获取所有键
  static getAllKeys(): string[] {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''))
  }
}
