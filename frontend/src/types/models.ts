// 数据模型类型定义

export interface User {
  userId: string
  username: string
  password: string
  name: string
  email: string
  phone: string
  registrationDate: string
  lastLoginTime: string
  role: 'reader' | 'admin' | 'superadmin'
}

export interface Reader {
  readerId: string
  userId: string
  borrowLimit: number
  borrowedCount: number
  membershipLevel: string
  creditScore: number
  totalFines: number
}

export interface Admin {
  adminId: string
  userId: string
  adminRole: string
  department: string
}

export interface Publication {
  publicationId: string
  title: string
  author: string
  publisher: string
  publishDate: string
  status: 'available' | 'borrowed' | 'reserved' | 'unavailable'
  borrowPeriod: number
  location: string
  totalCopies: number
  availableCopies: number
  averageRating: number
  totalRatings: number
  categoryId: string
  type: 'book' | 'magazine' | 'ebook'
}

export interface Book extends Publication {
  isbn: string
  category: string
  pages: number
  language: string
  edition: string
}

export interface Magazine extends Publication {
  issn: string
  issueNumber: string
  volume: string
}

export interface EBook extends Publication {
  fileFormat: string
  fileSize: number
  downloadUrl: string
  downloadCount: number
  simultaneousUsers: number
}

export interface BorrowRecord {
  recordId: string
  readerId: string
  publicationId: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'borrowed' | 'returned' | 'overdue'
  renewalCount: number
  maxRenewals: number
}

export interface Reservation {
  reservationId: string
  readerId: string
  publicationId: string
  reservationDate: string
  expiryDate: string
  status: 'pending' | 'ready' | 'cancelled' | 'expired'
  priority: number
}

export interface Fine {
  fineId: string
  readerId: string
  borrowRecordId: string
  amount: number
  reason: string
  issueDate: string
  paymentDate: string | null
  status: 'unpaid' | 'paid' | 'waived'
}

export interface Notification {
  notificationId: string
  userId: string
  type: string
  title: string
  content: string
  sendDate: string
  isRead: boolean
}

export interface Review {
  reviewId: string
  readerId: string
  publicationId: string
  rating: number
  comment: string
  reviewDate: string
  likes: number
}

export interface Category {
  categoryId: string
  categoryName: string
  parentCategoryId: string | null
  description: string
}
