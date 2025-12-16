// 通知服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import type { Notification } from '@/types/models'

export class NotificationService {
  // 创建通知
  static createNotification(
    userId: string,
    type: string,
    title: string,
    content: string
  ): Notification {
    const notificationId = CryptoUtils.generateId('notif')

    const notification: Notification = {
      notificationId,
      userId,
      type,
      title,
      content,
      sendDate: new Date().toISOString(),
      isRead: false
    }

    Database.insert(TABLES.NOTIFICATIONS, notification)
    return notification
  }

  // 标记为已读
  static markAsRead(notificationId: string): boolean {
    const updated = Database.update<Notification>(
      TABLES.NOTIFICATIONS,
      'notificationId',
      notificationId,
      { isRead: true }
    )
    return updated !== null
  }

  // 获取用户通知
  static getUserNotifications(userId: string): Notification[] {
    return Database.query<Notification>(TABLES.NOTIFICATIONS, n => n.userId === userId)
  }

  // 获取未读通知数量
  static getUnreadCount(userId: string): number {
    const notifications = Database.query<Notification>(
      TABLES.NOTIFICATIONS,
      n => n.userId === userId && !n.isRead
    )
    return notifications.length
  }

  // 发送到期提醒
  static sendDueReminder(userId: string, publicationTitle: string, dueDate: string): void {
    this.createNotification(
      userId,
      'due_reminder',
      '借阅即将到期',
      `您借阅的《${publicationTitle}》将于 ${new Date(dueDate).toLocaleDateString()} 到期，请及时归还。`
    )
  }

  // 发送逾期通知
  static sendOverdueNotice(userId: string, publicationTitle: string, overdueDays: number): void {
    this.createNotification(
      userId,
      'overdue',
      '借阅已逾期',
      `您借阅的《${publicationTitle}》已逾期 ${overdueDays} 天，请尽快归还。`
    )
  }

  // 发送预约到书通知
  static sendReservationReady(userId: string, publicationTitle: string): void {
    this.createNotification(
      userId,
      'reservation_ready',
      '预约图书已到',
      `您预约的《${publicationTitle}》现已可借，请在7天内前来借阅。`
    )
  }

  // 删除通知
  static deleteNotification(notificationId: string): boolean {
    return Database.delete<Notification>(TABLES.NOTIFICATIONS, 'notificationId', notificationId)
  }

  // 清空已读通知
  static clearReadNotifications(userId: string): number {
    const notifications = Database.query<Notification>(
      TABLES.NOTIFICATIONS,
      n => n.userId === userId && n.isRead
    )

    let count = 0
    notifications.forEach(n => {
      if (this.deleteNotification(n.notificationId)) {
        count++
      }
    })

    return count
  }
}
