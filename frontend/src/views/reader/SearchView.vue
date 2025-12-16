<template>
  <div class="search-view">
    <h1>搜索图书</h1>

    <!-- 搜索框 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="searchForm.author" placeholder="请输入作者" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="书籍" value="book" />
            <el-option label="期刊" value="magazine" />
            <el-option label="电子书" value="ebook" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 搜索结果 -->
    <div class="results-header">
      <span>找到 {{ filteredBooks.length }} 本图书</span>
    </div>

    <div v-if="filteredBooks.length === 0" class="empty-result">
      <el-empty description="没有找到相关图书" />
    </div>

    <div v-else class="books-grid">
      <el-card
        v-for="book in filteredBooks"
        :key="book.publicationId"
        class="book-card"
        shadow="hover"
      >
        <div class="book-cover">📚</div>
        <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
        <p class="book-author">作者：{{ book.author }}</p>
        <p class="book-publisher">出版社：{{ book.publisher }}</p>
        <p class="book-type">
          <el-tag :type="getTypeColor(book.type)" size="small">
            {{ getTypeName(book.type) }}
          </el-tag>
        </p>
        <p class="book-location">位置：{{ book.location }}</p>
        <p class="book-available">
          可借数量：
          <span :class="book.availableCopies > 0 ? 'available' : 'unavailable'">
            {{ book.availableCopies }} / {{ book.totalCopies }}
          </span>
        </p>
        
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
            v-else-if="!isReserved(book.publicationId)"
            type="warning"
            size="small"
            @click="handleReserve(book)"
          >
            预约
          </el-button>
          <el-button
            v-else
            type="info"
            size="small"
            disabled
          >
            已预约
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Database, TABLES } from '@/services/database'
import { CryptoUtils } from '@/utils/crypto'
import { useAuthStore } from '@/stores/auth'
import type { Publication, Reader, Reservation } from '@/types/models'

const authStore = useAuthStore()
const books = ref<Publication[]>([])
const readerInfo = ref<Reader | null>(null)
const myReservations = ref<Reservation[]>([])

const searchForm = reactive({
  title: '',
  author: '',
  type: ''
})

const filteredBooks = computed(() => {
  let result = books.value
  if (searchForm.title) {
    result = result.filter(b => b.title.includes(searchForm.title))
  }
  if (searchForm.author) {
    result = result.filter(b => b.author.includes(searchForm.author))
  }
  if (searchForm.type) {
    result = result.filter(b => b.type === searchForm.type)
  }
  return result
})

onMounted(() => {
  loadBooks()
  loadReaderInfo()
  loadMyReservations()
})

const loadBooks = () => {
  books.value = Database.getAll<Publication>(TABLES.PUBLICATIONS)
}

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

const loadMyReservations = () => {
  if (!readerInfo.value) return
  
  myReservations.value = Database.query<Reservation>(
    TABLES.RESERVATIONS,
    r => r.readerId === readerInfo.value?.readerId && r.status === 'pending'
  )
}

const isReserved = (publicationId: string) => {
  return myReservations.value.some(r => r.publicationId === publicationId)
}

const handleSearch = () => {
  // 搜索已通过 computed 实现
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.author = ''
  searchForm.type = ''
}

const handleBorrow = (book: Publication) => {
  ElMessage.info('请联系管理员办理借阅')
}

const handleReserve = (book: Publication) => {
  if (!readerInfo.value) {
    ElMessage.error('请先登录')
    return
  }
  
  // 计算优先级
  const allReservations = Database.query(
    TABLES.RESERVATIONS,
    (r: any) => r.publicationId === book.publicationId && r.status === 'pending'
  )
  const priority = 100 - allReservations.length
  
  // 创建预约记录
  const reservationDate = new Date()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)
  
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
  loadMyReservations()
}

const getTypeName = (type: string) => {
  const names: Record<string, string> = {
    book: '书籍',
    magazine: '期刊',
    ebook: '电子书'
  }
  return names[type] || type
}

const getTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    book: 'primary',
    magazine: 'success',
    ebook: 'warning'
  }
  return colors[type] || ''
}
</script>

<style scoped>
.search-view {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  margin-bottom: 24px;
  color: #333;
}

.search-card {
  margin-bottom: 24px;
}

.results-header {
  margin-bottom: 16px;
  font-size: 16px;
  color: #666;
}

.empty-result {
  margin-top: 60px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.book-card {
  text-align: center;
  transition: all 0.3s;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  font-weight: 600;
}

.book-author,
.book-publisher,
.book-location {
  font-size: 14px;
  color: #666;
  margin: 8px 0;
}

.book-type {
  margin: 10px 0;
}

.book-available {
  font-size: 14px;
  color: #666;
  margin: 10px 0;
}

.book-available .available {
  color: #67c23a;
  font-weight: bold;
}

.book-available .unavailable {
  color: #f56c6c;
  font-weight: bold;
}

.book-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
