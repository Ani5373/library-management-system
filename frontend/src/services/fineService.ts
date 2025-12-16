// 罚款管理服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import { UserService } from './userService'
import type { Fine, Reader } from '@/types/models'

export class FineService {
  private static readonly DAILY_FINE_RATE = 0.5 // 每天罚款0.5元

  // 计算罚款金额
  static calculateFineAmount(overdueDays: number): number {
    return overdueDays * this.DAILY_FINE_RATE
  }

  // 创建罚款记录
  static createFine(
    readerId: string,
    borrowRecordId: string,
    overdueDays: number,
    reason: string
  ): Fine {
    const fineId = CryptoUtils.generateId('fine')
    const amount = this.calculateFineAmount(overdueDays)

    const fine: Fine = {
      fineId,
      readerId,
      borrowRecordId,
      amount,
      reason,
      issueDate: new Date().toISOString(),
      paymentDate: null,
      status: 'unpaid'
    }

    Database.insert(TABLES.FINES, fine)

    // 更新读者罚款总额
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', readerId)
    if (reader) {
      UserService.updateReader(readerId, {
        totalFines: reader.totalFines + amount
      })
    }

    return fine
  }

  // 支付罚款
  static payFine(fineId: string): { success: boolean; message: string } {
    const fine = Database.getById<Fine>(TABLES.FINES, 'fineId', fineId)
    if (!fine) {
      return { success: false, message: '罚款记录不存在' }
    }

    if (fine.status === 'paid') {
      return { success: false, message: '罚款已支付' }
    }

    if (fine.status === 'waived') {
      return { success: false, message: '罚款已减免' }
    }

    // 更新罚款状态
    Database.update<Fine>(TABLES.FINES, 'fineId', fineId, {
      status: 'paid',
      paymentDate: new Date().toISOString()
    })

    // 减少读者罚款总额
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', fine.readerId)
    if (reader) {
      UserService.updateReader(fine.readerId, {
        totalFines: Math.max(0, reader.totalFines - fine.amount)
      })
    }

    return { success: true, message: '支付成功' }
  }

  // 减免罚款
  static waiveFine(fineId: string): { success: boolean; message: string } {
    const fine = Database.getById<Fine>(TABLES.FINES, 'fineId', fineId)
    if (!fine) {
      return { success: false, message: '罚款记录不存在' }
    }

    if (fine.status === 'paid') {
      return { success: false, message: '罚款已支付，无法减免' }
    }

    if (fine.status === 'waived') {
      return { success: false, message: '罚款已减免' }
    }

    // 更新罚款状态
    Database.update<Fine>(TABLES.FINES, 'fineId', fineId, {
      status: 'waived',
      paymentDate: new Date().toISOString()
    })

    // 减少读者罚款总额
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', fine.readerId)
    if (reader) {
      UserService.updateReader(fine.readerId, {
        totalFines: Math.max(0, reader.totalFines - fine.amount)
      })
    }

    return { success: true, message: '减免成功' }
  }

  // 获取读者的罚款记录
  static getReaderFines(readerId: string): Fine[] {
    return Database.query<Fine>(TABLES.FINES, fine => fine.readerId === readerId)
  }

  // 获取未支付的罚款
  static getUnpaidFines(readerId: string): Fine[] {
    return Database.query<Fine>(
      TABLES.FINES,
      fine => fine.readerId === readerId && fine.status === 'unpaid'
    )
  }

  // 获取所有罚款记录
  static getAllFines(): Fine[] {
    return Database.getAll<Fine>(TABLES.FINES)
  }

  // 获取罚款统计
  static getFineStatistics(): {
    totalFines: number
    unpaidFines: number
    paidFines: number
    waivedFines: number
    totalAmount: number
    unpaidAmount: number
  } {
    const fines = this.getAllFines()

    return {
      totalFines: fines.length,
      unpaidFines: fines.filter(f => f.status === 'unpaid').length,
      paidFines: fines.filter(f => f.status === 'paid').length,
      waivedFines: fines.filter(f => f.status === 'waived').length,
      totalAmount: fines.reduce((sum, f) => sum + f.amount, 0),
      unpaidAmount: fines.filter(f => f.status === 'unpaid').reduce((sum, f) => sum + f.amount, 0)
    }
  }
}
