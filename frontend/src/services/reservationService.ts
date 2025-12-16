// 预约管理服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import type { Reservation } from '@/types/models'

export class ReservationService {
  // 创建预约
  static createReservation(
    readerId: string,
    publicationId: string
  ): { success: boolean; message: string; reservation?: Reservation } {
    // 检查是否已预约
    const existing = Database.query<Reservation>(
      TABLES.RESERVATIONS,
      r => r.readerId === readerId && r.publicationId === publicationId && r.status === 'pending'
    )

    if (existing.length > 0) {
      return { success: false, message: '已预约该出版物' }
    }

    // 计算优先级（基于预约时间）
    const allReservations = Database.query<Reservation>(
      TABLES.RESERVATIONS,
      r => r.publicationId === publicationId && r.status === 'pending'
    )
    const priority = allReservations.length + 1

    const reservationId = CryptoUtils.generateId('res')
    const reservationDate = new Date()
    const expiryDate = new Date(reservationDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7天后过期

    const reservation: Reservation = {
      reservationId,
      readerId,
      publicationId,
      reservationDate: reservationDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'pending',
      priority
    }

    Database.insert(TABLES.RESERVATIONS, reservation)

    return { success: true, message: '预约成功', reservation }
  }

  // 取消预约
  static cancelReservation(reservationId: string): { success: boolean; message: string } {
    const reservation = Database.getById<Reservation>(
      TABLES.RESERVATIONS,
      'reservationId',
      reservationId
    )

    if (!reservation) {
      return { success: false, message: '预约记录不存在' }
    }

    // 删除预约
    Database.delete<Reservation>(TABLES.RESERVATIONS, 'reservationId', reservationId)

    // 重新调整优先级
    this.reorderPriorities(reservation.publicationId)

    return { success: true, message: '取消成功' }
  }

  // 重新调整优先级
  private static reorderPriorities(publicationId: string): void {
    const reservations = Database.query<Reservation>(
      TABLES.RESERVATIONS,
      r => r.publicationId === publicationId && r.status === 'pending'
    )

    // 按预约时间排序
    reservations.sort(
      (a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()
    )

    // 更新优先级
    reservations.forEach((r, index) => {
      Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', r.reservationId, {
        priority: index + 1
      })
    })
  }

  // 获取读者的预约记录
  static getReaderReservations(readerId: string): Reservation[] {
    return Database.query<Reservation>(TABLES.RESERVATIONS, r => r.readerId === readerId)
  }

  // 获取出版物的预约队列
  static getPublicationReservations(publicationId: string): Reservation[] {
    const reservations = Database.query<Reservation>(
      TABLES.RESERVATIONS,
      r => r.publicationId === publicationId && r.status === 'pending'
    )

    return reservations.sort((a, b) => a.priority - b.priority)
  }

  // 通知下一位预约者
  static notifyNextReserver(publicationId: string): Reservation | null {
    const reservations = this.getPublicationReservations(publicationId)
    if (reservations.length === 0) return null

    const nextReservation = reservations[0]
    Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', nextReservation.reservationId, {
      status: 'ready'
    })

    return nextReservation
  }

  // 检查并处理过期预约
  static processExpiredReservations(): number {
    const now = new Date().getTime()
    const reservations = Database.getAll<Reservation>(TABLES.RESERVATIONS)

    let expiredCount = 0

    reservations.forEach(r => {
      if (r.status === 'pending' && new Date(r.expiryDate).getTime() < now) {
        Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', r.reservationId, {
          status: 'expired'
        })
        expiredCount++

        // 通知下一位预约者
        this.notifyNextReserver(r.publicationId)
      }
    })

    return expiredCount
  }
}
