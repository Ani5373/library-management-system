// 数据管理工具
import { Database } from '@/services/database'

export class DataManager {
  // 导出所有数据
  static exportData(): void {
    const data = Database.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `library-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // 导入数据
  static importData(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
          const success = Database.importData(data)
          resolve(success)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }

  // 清空所有数据
  static clearAllData(): void {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      Database.clearAll()
      window.location.reload()
    }
  }

  // 重置为初始数据
  static resetToDefault(): void {
    if (confirm('确定要重置为初始数据吗？当前数据将被清空！')) {
      Database.clearAll()
      window.location.reload()
    }
  }
}
