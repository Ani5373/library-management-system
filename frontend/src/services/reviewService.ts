// 评价服务
import { Database, TABLES } from './database'
import { CryptoUtils } from '@/utils/crypto'
import { PublicationService } from './publicationService'
import type { Review } from '@/types/models'

export class ReviewService {
  // 提交评价
  static createReview(
    readerId: string,
    publicationId: string,
    rating: number,
    comment: string
  ): { success: boolean; message: string; review?: Review } {
    // 验证评分范围
    if (rating < 1 || rating > 5) {
      return { success: false, message: '评分必须在1-5之间' }
    }

    // 检查是否已评价
    const existing = Database.query<Review>(
      TABLES.REVIEWS,
      r => r.readerId === readerId && r.publicationId === publicationId
    )

    if (existing.length > 0) {
      return { success: false, message: '已评价过该出版物' }
    }

    const reviewId = CryptoUtils.generateId('review')

    const review: Review = {
      reviewId,
      readerId,
      publicationId,
      rating,
      comment,
      reviewDate: new Date().toISOString(),
      likes: 0
    }

    Database.insert(TABLES.REVIEWS, review)

    // 更新出版物评分
    PublicationService.updateRating(publicationId, rating)

    return { success: true, message: '评价成功', review }
  }

  // 编辑评价
  static updateReview(
    reviewId: string,
    rating: number,
    comment: string
  ): { success: boolean; message: string } {
    const review = Database.getById<Review>(TABLES.REVIEWS, 'reviewId', reviewId)
    if (!review) {
      return { success: false, message: '评价不存在' }
    }

    // 验证评分范围
    if (rating < 1 || rating > 5) {
      return { success: false, message: '评分必须在1-5之间' }
    }

    Database.update<Review>(TABLES.REVIEWS, 'reviewId', reviewId, {
      rating,
      comment
    })

    // 重新计算出版物评分
    const allReviews = this.getPublicationReviews(review.publicationId)
    const ratings = allReviews.map(r => r.rating)
    PublicationService.recalculateRating(review.publicationId, ratings)

    return { success: true, message: '更新成功' }
  }

  // 删除评价
  static deleteReview(reviewId: string): { success: boolean; message: string } {
    const review = Database.getById<Review>(TABLES.REVIEWS, 'reviewId', reviewId)
    if (!review) {
      return { success: false, message: '评价不存在' }
    }

    Database.delete<Review>(TABLES.REVIEWS, 'reviewId', reviewId)

    // 重新计算出版物评分
    const allReviews = this.getPublicationReviews(review.publicationId)
    const ratings = allReviews.map(r => r.rating)
    PublicationService.recalculateRating(review.publicationId, ratings)

    return { success: true, message: '删除成功' }
  }

  // 获取出版物的所有评价
  static getPublicationReviews(publicationId: string): Review[] {
    return Database.query<Review>(TABLES.REVIEWS, r => r.publicationId === publicationId)
  }

  // 获取读者的所有评价
  static getReaderReviews(readerId: string): Review[] {
    return Database.query<Review>(TABLES.REVIEWS, r => r.readerId === readerId)
  }

  // 点赞评价
  static likeReview(reviewId: string): boolean {
    const review = Database.getById<Review>(TABLES.REVIEWS, 'reviewId', reviewId)
    if (!review) return false

    Database.update<Review>(TABLES.REVIEWS, 'reviewId', reviewId, {
      likes: review.likes + 1
    })

    return true
  }
}
