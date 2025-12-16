<template>
  <div class="home-page">
    <h1>欢迎来到图书馆</h1>
    
    <!-- 用户信息卡片 -->
    <el-card class="user-card" v-if="readerInfo">
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ readerInfo.borrowedCount }} / {{ readerInfo.borrowLimit }}</div>
          <div class="stat-label">当前借阅</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ readerInfo.creditScore }}</div>
          <div class="stat-label">信用分数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ readerInfo.membershipLevel }}</div>
          <div class="stat-label">会员等级</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">¥{{ readerInfo.totalFines.toFixed(2) }}</div>
          <div class="stat-label">待缴罚款</div>
        </div>
      </div>
    </el-card>

    <!-- 推荐图书 -->
    <h2 class="section-title">推荐图书</h2>
    <div class="books-grid" v-if="recommendedBooks.length > 0">
      <el-card
        v-for="book in recommendedBooks"
        :key="book.publicationId"
        class="book-card"
        shadow="hover"
      >
        <div class="book-cover">📚</div>
        <h3 class="book-title">{{ book.title }}</h3>
        <p class="book-author">作者：{{ book.author }}</p>
        <p class="book-status">
          <el-tag :type="book.status === 'available' ? 'success' : 'info'">
            {{ book.status === 'available' ? '可借' : '已借出' }}
          </el-tag>
        </p>
        <p class="book-available">可借数量：{{ book.availableCopies }} / {{ book.totalCopies }}</p>
        <div class="book-actions">
          <el-button
            v-if="book.availableCopies > 0"
            type="primary"
            size="small"
            @click="handleBorrow(book)"
          >
            借阅
          </el-button>
          <el-button
            v-else
            type="warning"
            size="small"
            @click="handleReserve(book)"
          >
            预约
          </el-button>
        </div>
      </el-card>
    </div>
    <el-empty v-else description="暂无推荐图书" />

    <!-- 快捷操作 -->
    <h2 class="section-title">快捷操作</h2>
    <div class="quick-actions">
      <el-button type="primary" @click="$router.push('/reader/search')">
        <el-icon><Search /></el-icon>
        搜索图书
      </el-button>
      <el-button type="success" @click="$router.push('/reader/borrow')">
        <el-icon><Reading /></el-icon>
        我的借阅
      </el-button>
      <el-button type="warning" @click="$router.push('/reader/reservation')">
        <el-icon><Clock /></el-icon>
        我的预约
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Reading, Clock } from '@element-plus/icons-vue'
import { Database, TABLES } from '@/services/database'
import { CryptoUtils } from '@/utils/crypto'
import { useAuthStore } from '@/stores/auth'
import type { Reader, Publication } from '@/types/models'

const authStore = useAuthStore()
const readerInfo = ref<Reader | null>(null)
const recommendedBooks = ref<Publication[]>([])

onMounted(() => {
  loadReaderInfo()
  loadRecommendedBooks()
})

const loadReaderInfo = () => {
  if (!authStore.user) return
  
  const readers = Database.query<Reader>(
    TABLES.READERS,
    r => r.userId === authStore.user?.userId
  )
  if (readers.length > 0) {
    readerInfo.value = readers[0]
  }
}

const loadRecommendedBooks = () => {
  const allBooks = Database.getAll<Publication>(TABLES.PUBLICATIONS)
  // 简单推荐：显示可借的图书
  recommendedBooks.value = allBooks
    .filter(book => book.availableCopies > 0)
    .slice(0, 6)
}

const handleBorrow = (book: Publication) => {
  ElMessage.info('请联系管理员办理借阅')
}

const handleReserve = (book: Publication) => {
  if (!authStore.user || !readerInfo.value) {
    ElMessage.error('请先登录')
    return
  }
  
  // 检查是否已经预约过
  const existingReservations = Database.query(
    TABLES.RESERVATIONS,
    (r: any) => r.readerId === readerInfo.value?.readerId && r.publicationId === book.publicationId && r.status === 'pending'
  )
  
  if (existingReservations.length > 0) {
    ElMessage.warning('您已经预约过这本书了')
    return
  }
  
  // 计算优先级（基于预约时间，越早预约优先级越高）
  const allReservations = Database.query(
    TABLES.RESERVATIONS,
    (r: any) => r.publicationId === book.publicationId && r.status === 'pending'
  )
  const priority = 100 - allReservations.length
  
  // 创建预约记录
  const reservationDate = new Date()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7) // 7天后过期
  
  const reservation = {
    reservationId: CryptoUtils.generateId('resv'),
    readerId: readerInfo.value.readerId,
    publicationId: book.publicationId,
    reservationDate: reservationDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    status: 'pending',
    priority
  }
  
  Database.insert(TABLES.RESERVATIONS, reservation)
  ElMessage.success('预约成功！图书可借时会通知您')
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
}

.user-card {
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.user-card :deep(.el-card__body) {
  padding: 30px;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.section-title {
  font-size: 24px;
  margin: 30px 0 20px;
  color: #667eea;
  font-weight: 600;
  position: relative;
  padding-left: 15px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.book-card {
  text-align: center;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.book-cover {
  font-size: 60px;
  margin: 20px 0;
}

.book-title {
  font-size: 16px;
  margin: 10px 0;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}

.book-status {
  margin: 10px 0;
}

.book-available {
  font-size: 14px;
  color: #999;
  margin: 5px 0;
}

.quick-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.quick-actions .el-button {
  flex: 1;
  height: 60px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.quick-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.quick-actions .el-button--primary:hover {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
