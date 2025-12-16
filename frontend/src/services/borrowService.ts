// 借阅管理服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import { PublicationService } from './publicationService'
import { UserService } from './userService'
import type { BorrowRecord, Reader, Publication } from '@/types/models'

export class BorrowService {
  // 检查借阅资格
  static checkBorrowEligibility(readerId: string): { eligible: boolean; message: string } {
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', readerId)
    if (!reader) {
      return { eligible: false, message: '读者不存在' }
    }

    // 检查借阅上限
    if (reader.borrowedCount >= reader.borrowLimit) {
      return { eligible: false, message: '已达借阅上限' }
    }

    // 检查信用分数
    if (reader.creditScore < 60) {
      return { eligible: false, message: '信用分数不足' }
    }

    // 检查未支付罚款
    if (reader.totalFines > 50) {
      return { eligible: false, message: '未支付罚款超过限额' }
    }

    return { eligible: true, message: '可以借阅' }
  }

  // 创建借阅记录
  static createBorrowRecord(
    readerId: string,
    publicationId: string
  ): { success: boolean; message: string; record?: BorrowRecord } {
    // 检查借阅资格
    const eligibility = this.checkBorrowEligibility(readerId)
    if (!eligibility.eligible) {
      return { success: false, message: eligibility.message }
    }

    // 检查出版物是否可借
    const publication = PublicationService.getPublicationById(publicationId)
    if (!publication) {
      return { success: false, message: '出版物不存在' }
    }

    if (publication.availableCopies <= 0) {
      return { success: false, message: '出版物已全部借出' }
    }

    // 创建借阅记录
    const recordId = CryptoUtils.generateId('borrow')
    const borrowDate = new Date()
    const dueDate = new Date(borrowDate.getTime() + publication.borrowPeriod * 24 * 60 * 60 * 1000)

    const record: BorrowRecord = {
      recordId,
      readerId,
      publicationId,
      borrowDate: borrowDate.toISOString(),
      dueDate: dueDate.toISOString(),
      returnDate: null,
      status: 'borrowed',
      renewalCount: 0,
      maxRenewals: 2
    }

    Database.insert(TABLES.BORROW_RECORDS, record)

    // 减少可借数量
    PublicationService.updateAvailableCopies(publicationId, -1)

    // 增加读者借阅数量
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', readerId)
    if (reader) {
      UserService.updateReader(readerId, {
        borrowedCount: reader.borrowedCount + 1
      })
    }

    return { success: true, message: '借阅成功', record }
  }

  // 归还出版物
  static returnPublication(
    recordId: string
  ): { success: boolean; message: string; overdueDays?: number } {
    const record = Database.getById<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', recordId)
    if (!record) {
      return { success: false, message: '借阅记录不存在' }
    }

    if (record.status === 'returned') {
      return { success: false, message: '已归还' }
    }

    const returnDate = new Date()
    const dueDate = new Date(record.dueDate)
    const overdueDays = Math.max(0, Math.floor((returnDate.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)))

    // 更新借阅记录
    Database.update<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', recordId, {
      returnDate: returnDate.toISOString(),
      status: overdueDays > 0 ? 'overdue' : 'returned'
    })

    // 增加可借数量
    PublicationService.updateAvailableCopies(record.publicationId, 1)

    // 减少读者借阅数量
    const reader = Database.getById<Reader>(TABLES.READERS, 'readerId', record.readerId)
    if (reader) {
      UserService.updateReader(record.readerId, {
        borrowedCount: Math.max(0, reader.borrowedCount - 1)
      })

      // 更新信用分数
      if (overdueDays === 0) {
        // 按时归还，增加信用分数
        UserService.updateReader(record.readerId, {
          creditScore: Math.min(200, reader.creditScore + 2)
        })
      } else {
        // 逾期归还，减少信用分数
        UserService.updateReader(record.readerId, {
          creditScore: Math.max(0, reader.creditScore - overdueDays * 2)
        })
      }
    }

    return {
      success: true,
      message: overdueDays > 0 ? `归还成功，逾期 ${overdueDays} 天` : '归还成功',
      overdueDays
    }
  }

  // 续借出版物
  static renewBorrowRecord(
    recordId: string
  ): { success: boolean; message: string; newDueDate?: string } {
    const record = Database.getById<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', recordId)
    if (!record) {
      return { success: false, message: '借阅记录不存在' }
    }

    if (record.status !== 'borrowed') {
      return { success: false, message: '只能续借未归还的出版物' }
    }

    if (record.renewalCount >= record.maxRenewals) {
      return { success: false, message: '已达最大续借次数' }
    }

    // 获取出版物信息
    const publication = PublicationService.getPublicationById(record.publicationId)
    if (!publication) {
      return { success: false, message: '出版物不存在' }
    }

    // 延长应还日期
    const currentDueDate = new Date(record.dueDate)
    const newDueDate = new Date(currentDueDate.getTime() + publication.borrowPeriod * 24 * 60 * 60 * 1000)

    Database.update<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', recordId, {
      dueDate: newDueDate.toISOString(),
      renewalCount: record.renewalCount + 1
    })

    return {
      success: true,
      message: '续借成功',
      newDueDate: newDueDate.toISOString()
    }
  }

  // 获取读者的借阅记录
  static getReaderBorrowRecords(readerId: string): BorrowRecord[] {
    return Database.query<BorrowRecord>(TABLES.BORROW_RECORDS, record => record.readerId === readerId)
  }

  // 获取所有借阅记录
  static getAllBorrowRecords(): BorrowRecord[] {
    return Database.getAll<BorrowRecord>(TABLES.BORROW_RECORDS)
  }

  // 获取逾期记录
  static getOverdueRecords(): BorrowRecord[] {
    const now = new Date().getTime()
    return Database.query<BorrowRecord>(
      TABLES.BORROW_RECORDS,
      record => record.status === 'borrowed' && new Date(record.dueDate).getTime() < now
    )
  }

  // 获取即将到期的记录（3天内）
  static getUpcomingDueRecords(): BorrowRecord[] {
    const now = new Date().getTime()
    const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000

    return Database.query<BorrowRecord>(
      TABLES.BORROW_RECORDS,
      record => {
        if (record.status !== 'borrowed') return false
        const dueTime = new Date(record.dueDate).getTime()
        return dueTime > now && dueTime <= threeDaysLater
      }
    )
  }
}
